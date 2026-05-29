import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';

import { voiceApi } from './api';

let player: AudioPlayer | null = null;

type SpeakOptions = {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

const speechLanguageMap: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
};

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('Failed to stop speech', error);
  }

  try {
    player?.pause();
    player?.release();
    player = null;
  } catch (error) {
    console.warn('Failed to stop audio player', error);
  }
}

export async function speakText(text: string, language: string, options: SpeakOptions = {}): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  try {
    await Speech.stop();
    Speech.speak(cleanText, {
      language: speechLanguageMap[language] || 'en-IN',
      rate: 0.92,
      pitch: 1,
      onStart: options.onStart,
      onDone: options.onDone,
      onStopped: options.onDone,
      onError: (error) => {
        options.onError?.(error);
        options.onDone?.();
      },
    });
    return;
  } catch (error) {
    console.warn('Native speech failed, trying server TTS.', error);
    options.onError?.(error);
  }

  try {
    const response = await voiceApi.post('/chat/tts', {
      text: cleanText,
      language,
    });
    const audioBase64 = response.data?.audio_base64;
    if (!audioBase64) {
      console.warn('TTS returned no audio.');
      return;
    }

    const path = `${cacheDirectory || ''}arthsaathi-tts-${Date.now()}.mp3`;
    await writeAsStringAsync(path, audioBase64, { encoding: EncodingType.Base64 });

    player?.release();
    player = createAudioPlayer({ uri: path });
    options.onStart?.();
    player.play();
    setTimeout(() => options.onDone?.(), Math.max(1800, cleanText.length * 70));
  } catch (error) {
    console.warn('TTS failed', error);
    options.onError?.(error);
    options.onDone?.();
  }
}
