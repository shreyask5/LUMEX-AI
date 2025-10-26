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

import { useState, useEffect } from "react";

export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export function useCameraDevices() {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        setLoading(true);
        
        // Request permission first to get full device labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
            groupId: device.groupId,
          }));
        
        setDevices(videoDevices);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enumerate devices');
        setLoading(false);
      }
    };

    enumerateDevices();

    // Listen for device changes
    const handleDeviceChange = () => enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  return { devices, loading, error };
}

