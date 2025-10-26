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
  GoogleGenAIOptions,
  LiveClientToolResponse,
  LiveServerMessage,
  Part,
} from "@google/genai";

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

/**
 * Scene Memory Types for Multi-Step Navigation
 */

// Represents a 2D position in the scene
export type Position = [number, number];

// Represents an object detected in the scene with name and position
export interface SceneObject {
  name: string;
  position: Position;
  description?: string; // Optional description for more context
  timestamp?: number; // When the object was detected
}

// The complete scene state tracking user and objects
export interface SceneMemory {
  user: Position; // Current user position [x, y]
  objects: SceneObject[]; // List of detected objects in the scene
  goal?: Position; // Optional goal position the user wants to reach
  goalDescription?: string; // Description of the goal (e.g., "other side of the room")
  history: SceneSnapshot[]; // History of scene states for tracking movement
}

// Snapshot of scene at a point in time
export interface SceneSnapshot {
  timestamp: number;
  user: Position;
  objects: SceneObject[];
  action?: string; // What action was taken to reach this state
}

// Navigation step instruction from Gemini
export interface NavigationStep {
  instruction: string; // The instruction text (e.g., "Take 2 steps forward")
  expectedUserPosition?: Position; // Expected position after this step
  isComplete: boolean; // Whether the navigation goal is reached
  nextStep?: string; // Preview of what comes next
}

// Navigation state for multi-step guidance
export interface NavigationState {
  active: boolean; // Whether navigation is currently active
  currentStep: number; // Current step index
  steps: NavigationStep[]; // All steps in the current navigation
  scene: SceneMemory; // Current scene state
  awaitingUserConfirmation?: boolean; // Whether waiting for user to complete step
}
