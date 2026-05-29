import { useState, useEffect } from 'react';
import { 
  useAudioRecorder as useExpoRecorder, 
  useAudioRecorderState, 
  AudioModule, 
  RecordingPresets 
} from 'expo-audio';

// Adjust these constants to tune the sensitivity of your waveform
const NOISE_GATE_FLOOR = -42; // Any sound quieter than -42dB (AC hums, room static) becomes 0
const AUDIO_CEILING = -3;     // Any sound louder than -3dB hits maximum wave height
const SENSIVITY_CURVE = 2.5;   // Higher = less twitchy to tiny sounds; lower = more reactive

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function useAudioRecorder() {
  // 1. Pass configuration into instantiation hook to register native metering intents
  const recorder = useExpoRecorder(RECORDING_OPTIONS);
  
  // 2. Poll native buffer state every 200ms for visual updates without overwhelming React
  const status = useAudioRecorderState(recorder, 200); 

  const start = async () => {
    try {
      // 3. Configure global audio session permissions for iOS/Android device channels
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) return;

      // 4. Re-verify configuration structure during physical hardware spin-up
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS);

      await recorder.record();
    } catch (e) {
      console.warn('Recording start failed', e);
    }
  };

  const stop = async (): Promise<string | null> => {
    try {
      await recorder.stop();
      return recorder.uri ?? null;
    } catch {
      return null;
    }
  };

  // 6. Audio Scaling & Filtering Math Block
  let normalizedLevel = 0;
  let currentMetering = -160;

  if (status?.isRecording && status.metering !== undefined && status.metering !== null) {
    currentMetering = status.metering;
    // Restrict raw decibel value inside our active visual spectrum window
    const clampedDb = Math.min(AUDIO_CEILING, Math.max(NOISE_GATE_FLOOR, status.metering));
    
    // Map the window range into a baseline 0.0 to 1.0 linear ratio
    const linearRatio = (clampedDb - NOISE_GATE_FLOOR) / (AUDIO_CEILING - NOISE_GATE_FLOOR);
    
    // Apply power function curve to isolate real vocal bursts and flatten baseline static
    normalizedLevel = Math.pow(linearRatio, SENSIVITY_CURVE);
  } else {
    normalizedLevel = 0;
  }

  return { 
    start, 
    stop, 
    metering: currentMetering, 
    normalizedLevel, 
    isRecording: status?.isRecording ?? false 
  };
}
