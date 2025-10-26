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

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import { NavigationState, Position } from "../../types";
import AudioPulse from "../audio-pulse/AudioPulse";
import "./control-tray.scss";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
};

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
  enableEditingSettings,
}: ControlTrayProps) {
  const videoStreams = [useWebcam({ facingMode: 'environment' }), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);

  const { client, connected, connect, disconnect, volume } =
    useLiveAPIContext();

  /**
   * Navigation State Management
   * Tracks whether multi-step navigation is active and the current scene state
   */
  const [navigationState, setNavigationState] = useState<NavigationState>({
    active: false,
    currentStep: 0,
    steps: [],
    scene: {
      user: [0, 0],
      objects: [],
      history: []
    }
  });

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  // Auto-start webcam and connect on mount
  useEffect(() => {
    const autoStart = async () => {
      try {
        // Start webcam first
        await changeStreams(webcam)();
        // Then connect to API
        await connect();
      } catch (error) {
        console.error("Failed to auto-start:", error);
      }
    };
    autoStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  /**
   * Listen to scene updates from the client
   * This syncs the navigation state with the client's scene memory
   */
  useEffect(() => {
    if (!client) return;

    const handleSceneUpdate = (scene: typeof navigationState.scene) => {
      setNavigationState(prev => ({
        ...prev,
        scene
      }));
    };

    client.on('sceneupdate', handleSceneUpdate);

    return () => {
      client.off('sceneupdate', handleSceneUpdate);
    };
  }, [client]);

  /**
   * Enhanced message sender with navigation awareness
   * Instead of periodic messages, this queries with scene context when navigation is active
   */
  useEffect(() => {
    console.log("[NAV] Effect triggered, connected:", connected, "navigationActive:", navigationState.active);

    if (!connected) {
      console.log("[NAV] Not connected, skipping setup");
      return;
    }

    // If navigation is NOT active, send periodic contextual queries
    if (!navigationState.active) {
      console.log("[NAV] Setting up 30-second interval for contextual queries");

      const intervalId = setInterval(() => {
        console.log("[NAV] Interval fired, sending contextual query");

        try {
          // Send query without scene context when not navigating
          client.send([{ text: "Talk about the surrounding concisely" }], true, false);
          console.log("[NAV] Contextual query sent successfully");
        } catch (error) {
          console.error("[NAV] Error sending query:", error);
        }
      }, 30000);

      console.log("[NAV] Interval set up with ID:", intervalId);

      return () => {
        console.log("[NAV] Cleaning up interval:", intervalId);
        clearInterval(intervalId);
      };
    } else {
      // When navigation is active, don't send periodic messages
      // Navigation queries are sent on-demand with scene context
      console.log("[NAV] Navigation active, periodic queries disabled");
    }
  }, [connected, client, navigationState.active]);

  /**
   * Example: Trigger navigation mode
   * In a real application, this would be triggered by user voice commands
   * or UI interactions. For now, this serves as a demo function.
   *
   * To test navigation:
   * 1. User says: "There is a box in front of me. Help me get to the other side."
   * 2. System detects objects and sets up scene
   * 3. Queries Gemini with scene context for step-by-step instructions
   * 4. After each step, updates user position and queries again
   */
  const startNavigation = (goalDescription: string) => {
    console.log("[NAV] Starting navigation with goal:", goalDescription);

    // Set navigation goal in client's scene memory
    client.setNavigationGoal(goalDescription);

    // Activate navigation state
    setNavigationState(prev => ({
      ...prev,
      active: true,
      scene: {
        ...prev.scene,
        goalDescription
      }
    }));

    // Query Gemini with scene context for first navigation step
    const query = `I need to navigate: ${goalDescription}. What objects do you see and what should I do first?`;
    client.send([{ text: query }], true, true); // includeSceneContext = true
  };

  /**
   * Update user position after completing a navigation step
   * This is called after the user confirms they've completed an instruction
   */
  const updateNavigationStep = (newPosition: Position, action: string) => {
    console.log("[NAV] Updating position to:", newPosition, "after:", action);

    // Update position in client's scene memory
    client.updateUserPosition(newPosition, action);

    // Query for next step with updated scene context
    const query = "I completed that step. What's next?";
    client.send([{ text: query }], true, true); // includeSceneContext = true
  };

  /**
   * Complete navigation when goal is reached
   */
  const completeNavigation = () => {
    console.log("[NAV] Navigation complete");

    setNavigationState(prev => ({
      ...prev,
      active: false,
      currentStep: 0,
      steps: []
    }));
  };

  // Example: Expose navigation functions for testing
  // In production, these would be triggered by voice commands or UI
  useEffect(() => {
    if (connected && client) {
      // Make functions available globally for testing in console
      (window as any).lumaNav = {
        start: startNavigation,
        updateStep: updateNavigationStep,
        complete: completeNavigation,
        addObject: (name: string, x: number, y: number, description?: string) => {
          client.updateSceneObject({ name, position: [x, y], description });
        },
        resetScene: () => client.resetScene(),
        getScene: () => client.sceneMemory
      };
      console.log("[NAV] Navigation controls available at window.lumaNav");
      console.log("[NAV] Example usage:");
      console.log("  window.lumaNav.addObject('box', 3, 0, 'cardboard box')");
      console.log("  window.lumaNav.start('get to the other side of the room')");
      console.log("  window.lumaNav.updateStep([2, 0], 'moved 2 steps right')");
      console.log("  window.lumaNav.complete()");
    }
  }, [connected, client]);

  return (
    <section className="control-tray">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <nav className={cn("actions-nav", { disabled: !connected })}>
        <div className="action-button no-action outlined">
          <AudioPulse volume={volume} active={connected} hover={false} />
        </div>
        {children}
      </nav>

      <div className={cn("connection-container", { connected })}>
        <span className="text-indicator">
          {connected ? "Connected - Visual Assistance Active" : "Connecting..."}
        </span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
