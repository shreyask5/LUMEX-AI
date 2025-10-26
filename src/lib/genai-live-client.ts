/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";

import { EventEmitter } from "eventemitter3";
import { difference } from "lodash";
import { LiveClientOptions, StreamingLog, SceneMemory, SceneObject, Position, SceneSnapshot } from "../types";
import { base64ToArrayBuffer } from "./utils";

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when an error occurs
  error: (error: ErrorEvent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
  // Emitted when scene memory is updated
  sceneupdate: (scene: SceneMemory) => void;
}

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  /**
   * Scene Memory Management
   * Stores the current scene state including user position and detected objects
   * This allows multi-step navigation even when objects are no longer visible
   */
  private _sceneMemory: SceneMemory = {
    user: [0, 0], // Initialize user at origin
    objects: [],
    history: []
  };

  public get sceneMemory(): SceneMemory {
    return this._sceneMemory;
  }

  constructor(options: LiveClientOptions) {
    super();
    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    this._status = "connecting";
    this.config = config;
    this._model = model;

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
    } catch (e) {
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      return false;
    }

    this._status = "connected";
    return true;
  }

  public disconnect() {
    if (!this.session) {
      return false;
    }
    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected`);
    return true;
  }

  protected onopen() {
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    this.log("server.error", e.message);
    this.emit("error", e);
  }

  protected onclose(e: CloseEvent) {
    this.log(
      `server.close`,
      `disconnected ${e.reason ? `with reason: ${e.reason}` : ``}`
    );
    this.emit("close", e);
  }

  protected async onmessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    if (message.serverContent) {
      const { serverContent } = message;
      if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      if ("turnComplete" in serverContent) {
        this.log("server.content", "turnComplete");
        this.emit("turncomplete");
      }

      if ("modelTurn" in serverContent) {
        let parts: Part[] = serverContent.modelTurn?.parts || [];

        // when its audio that is returned for modelTurn
        const audioParts = parts.filter(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);

        // strip the audio parts out of the modelTurn
        const otherParts = difference(parts, audioParts);
        // console.log("otherParts", otherParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });
        if (!otherParts.length) {
          return;
        }

        parts = otherParts;

        const content: { modelTurn: Content } = { modelTurn: { parts } };
        this.emit("content", content);
        this.log(`server.content`, message);
      }
    } else {
      console.log("received unmatched message", message);
    }
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== "connected") {
      return;
    }

    let hasAudio = false;
    let hasVideo = false;
    for (const ch of chunks) {
      this.session?.sendRealtimeInput({ media: ch });
      if (ch.mimeType.includes("audio")) {
        hasAudio = true;
      }
      if (ch.mimeType.includes("image")) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
        ? "audio"
        : hasVideo
        ? "video"
        : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * Update user position in scene memory
   * Call this after each navigation step is completed
   *
   * @param newPosition - The new [x, y] position of the user
   * @param action - Description of the action taken (e.g., "Moved 2 steps forward")
   */
  updateUserPosition(newPosition: Position, action?: string) {
    // Save current state to history before updating
    this._sceneMemory.history.push({
      timestamp: Date.now(),
      user: [...this._sceneMemory.user],
      objects: [...this._sceneMemory.objects],
      action
    });

    // Update user position
    this._sceneMemory.user = newPosition;

    this.log("scene.userUpdate", `User moved to [${newPosition[0]}, ${newPosition[1]}]${action ? ` - ${action}` : ''}`);
    this.emit("sceneupdate", this._sceneMemory);
  }

  /**
   * Add or update an object in scene memory
   *
   * @param object - The scene object to add or update
   */
  updateSceneObject(object: SceneObject) {
    const existingIndex = this._sceneMemory.objects.findIndex(
      obj => obj.name === object.name
    );

    if (existingIndex >= 0) {
      // Update existing object
      this._sceneMemory.objects[existingIndex] = {
        ...object,
        timestamp: Date.now()
      };
    } else {
      // Add new object
      this._sceneMemory.objects.push({
        ...object,
        timestamp: Date.now()
      });
    }

    this.log("scene.objectUpdate", `Object "${object.name}" at [${object.position[0]}, ${object.position[1]}]`);
    this.emit("sceneupdate", this._sceneMemory);
  }

  /**
   * Set navigation goal
   *
   * @param goal - Target position or description
   */
  setNavigationGoal(goal: Position | string) {
    if (typeof goal === 'string') {
      this._sceneMemory.goalDescription = goal;
    } else {
      this._sceneMemory.goal = goal;
    }

    this.log("scene.goalSet", typeof goal === 'string' ? goal : `[${goal[0]}, ${goal[1]}]`);
    this.emit("sceneupdate", this._sceneMemory);
  }

  /**
   * Clear scene memory (useful for starting fresh navigation)
   */
  resetScene() {
    this._sceneMemory = {
      user: [0, 0],
      objects: [],
      history: []
    };

    this.log("scene.reset", "Scene memory cleared");
    this.emit("sceneupdate", this._sceneMemory);
  }

  /**
   * Generate scene context string for including in Gemini prompts
   * This provides the model with awareness of the scene state
   */
  getSceneContext(): string {
    const { user, objects, goal, goalDescription } = this._sceneMemory;

    let context = `\n--- SCENE MEMORY ---\n`;
    context += `User Position: [${user[0]}, ${user[1]}]\n`;

    if (objects.length > 0) {
      context += `\nDetected Objects:\n`;
      objects.forEach(obj => {
        const relativeX = obj.position[0] - user[0];
        const relativeY = obj.position[1] - user[1];
        context += `- ${obj.name} at [${obj.position[0]}, ${obj.position[1]}] (relative: [${relativeX}, ${relativeY}])`;
        if (obj.description) {
          context += ` - ${obj.description}`;
        }
        context += `\n`;
      });
    } else {
      context += `No objects detected yet.\n`;
    }

    if (goal || goalDescription) {
      context += `\nNavigation Goal: `;
      if (goalDescription) {
        context += goalDescription;
      }
      if (goal) {
        context += ` [${goal[0]}, ${goal[1]}]`;
      }
      context += `\n`;
    }

    context += `--- END SCENE MEMORY ---\n`;

    return context;
  }

  /**
   * send normal content parts such as { text }
   * Enhanced to include scene context when navigation is active
   */
  send(parts: Part | Part[], turnComplete: boolean = true, includeSceneContext: boolean = false) {
    console.log("[SEND] GenAILiveClient.send() called");
    console.log("[SEND] Status:", this.status);
    console.log("[SEND] Session exists:", !!this.session);
    console.log("[SEND] Parts:", Array.isArray(parts) ? parts : [parts]);

    if (!this.session) {
      console.error("[SEND] No session exists, cannot send!");
      return;
    }

    try {
      let partsToSend = Array.isArray(parts) ? parts : [parts];

      // If scene context should be included, prepend it to the message
      if (includeSceneContext) {
        const sceneContext = this.getSceneContext();

        // Find text part and prepend scene context
        partsToSend = partsToSend.map(part => {
          if ('text' in part && part.text) {
            return { text: sceneContext + part.text };
          }
          return part;
        });

        // If no text part exists, add scene context as new text part
        if (!partsToSend.some(p => 'text' in p)) {
          partsToSend.unshift({ text: sceneContext });
        }
      }

      this.session?.sendClientContent({ turns: partsToSend, turnComplete });
      console.log("[SEND] sendClientContent() called successfully");
      this.log(`client.send`, {
        turns: partsToSend,
        turnComplete,
      });
    } catch (error) {
      console.error("[SEND] Error in sendClientContent:", error);
    }
  }
}
