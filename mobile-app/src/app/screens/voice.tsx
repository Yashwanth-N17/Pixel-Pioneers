import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { C } from '../../constants/colors';
import { useStore } from '../../store';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { MicButton } from '../../components/voice/MicButton';
import { Waveform } from '../../components/voice/Waveform';
import { endpoints } from '../../services/api';
import { speakText, stopSpeaking } from '../../services/tts';
import type { Lang } from '../../types';

type ChatMessage = { role: 'ai' | 'user'; text: string };

const languageCodeByName: Record<Lang, 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'mr'> = {
  English: 'en',
  Hindi: 'hi',
  Kannada: 'kn',
  Marathi: 'mr',
  Tamil: 'ta',
  Telugu: 'te',
};

function getAssistantReply(data: any) {
  return data?.reply || data?.response || data?.responseText || "I couldn't process that.";
}

function getTranscribedText(data: any) {
  return data?.transcribedText || data?.transcribed_text || data?.transcript || '';
}

function getRequestErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function VoiceScreen() {
  const router = useRouter();
  const occupation = useStore((state) => state.occupation);
  const language = useStore((state) => state.language);
  const fetchDashboardData = useStore((state) => state.fetchDashboardData);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Ask about loans, expenses, mandi prices, udhar, orders or shift payments. Tap the mic to speak.',
    },
  ]);
  const [interimText, setInterimText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { start, stop, normalizedLevel, isRecording } = useAudioRecorder();
  const languageCode = languageCodeByName[language] || 'en';
  const latestAiMessage = [...messages].reverse().find((message) => message.role === 'ai')?.text || '';
  const latestAiIndex = messages.map((message) => message.role).lastIndexOf('ai');

  const idlePulse = useSharedValue(1);

  useEffect(() => {
    if (!isRecording) {
      idlePulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(idlePulse);
      idlePulse.value = withTiming(1, { duration: 200 });
    }
  }, [idlePulse, isRecording]);

  const idleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: idlePulse.value }],
  }));

  const speakReply = (replyText: string) => {
    if (!isSpeechEnabled) return;

    void speakText(replyText, languageCode, {
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleSpeech = async () => {
    const nextEnabled = !isSpeechEnabled;
    setIsSpeechEnabled(nextEnabled);
    if (!nextEnabled) {
      setIsSpeaking(false);
      await stopSpeaking();
    }
  };

  const ask = async () => {
    if (!prompt.trim() || isSending) return;

    const text = prompt.trim();
    setMessages((current) => [...current, { role: 'user', text }]);
    setPrompt('');
    setInterimText('Thinking...');
    setIsSending(true);

    try {
      const response = await endpoints.sendChatMessage({
        message: text,
        language: languageCode,
        context: { occupation },
      });
      const reply = getAssistantReply(response.data?.data);
      const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply);
      setMessages((current) => [
        ...current,
        { role: 'ai', text: replyText },
      ]);
      speakReply(replyText);
      
      console.warn("AI TEXT CHAT RESPONSE:", JSON.stringify(response.data?.data));

      if (response.data?.data?.actionTriggers?.includes('TRANSACTION_ADDED')) {
        void fetchDashboardData();
      }
    } catch (error) {
      console.warn('Chat message failed', error);
      const errorMessage = getRequestErrorMessage(error, 'Error connecting to chat service.');
      setMessages((current) => [
        ...current,
        { role: 'ai', text: errorMessage },
      ]);
    } finally {
      setInterimText('');
      setIsSending(false);
    }
  };

  const startVoiceSession = async () => {
    setInterimText('Listening... tap mic again to send');
    await start();
  };

  const sendVoiceRecording = async (uri: string) => {
    setIsSending(true);
    setInterimText('Thinking...');

    try {
      const form = new FormData();
      form.append('audio', {
        uri,
        name: `voice-${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);
      form.append('language', languageCode);

      const response = await endpoints.sendVoiceMessage(form);
      const data = response.data?.data;
      const transcript = getTranscribedText(data);
      const reply = getAssistantReply(data);
      const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply);

      setMessages((current) => [
        ...current,
        ...(transcript ? [{ role: 'user' as const, text: transcript }] : []),
        { role: 'ai' as const, text: replyText },
      ]);
      speakReply(replyText);

      console.warn("AI VOICE CHAT RESPONSE:", JSON.stringify(data));

      if (data?.actionTriggers?.includes('TRANSACTION_ADDED')) {
        void fetchDashboardData();
      }
    } catch (error) {
      console.warn('Voice message failed', error);
      const errorMessage = getRequestErrorMessage(error, 'Error sending voice request to backend.');
      setMessages((current) => [
        ...current,
        { role: 'ai', text: errorMessage },
      ]);
    } finally {
      setInterimText('');
      setIsSending(false);
    }
  };

  const handleMicPress = async () => {
    if (isSending) return;

    if (isRecording) {
      setInterimText('Sending voice to backend...');
      const uri = await stop();
      if (!uri) {
        setInterimText('No audio captured. Please try again.');
        return;
      }
      await sendVoiceRecording(uri);
      return;
    }

    await startVoiceSession();
  };

  const hasSpoken = useRef(false);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMicPressRef = useRef(handleMicPress);

  useEffect(() => {
    handleMicPressRef.current = handleMicPress;
  }, [handleMicPress]);

  useEffect(() => {
    if (!isRecording) {
      hasSpoken.current = false;
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      return;
    }

    if (normalizedLevel > 0.15) {
      hasSpoken.current = true;
      setInterimText('Listening...');
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    } else if (hasSpoken.current && normalizedLevel < 0.08) {
      if (!silenceTimer.current) {
        silenceTimer.current = setTimeout(() => {
          handleMicPressRef.current();
        }, 1500);
      }
    }
  }, [normalizedLevel, isRecording]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, interimText]);

  useEffect(() => {
    return () => {
      void stopSpeaking();
    };
  }, []);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[C.emerald600, C.teal600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <SafeAreaView edges={['top']} className="pt-2">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-white text-2xl font-black">Voice Assistant</Text>
              <Text className="text-emerald-50 text-sm mt-1.5 font-medium leading-5">
                {isSpeaking ? 'Speaking...' : isRecording ? 'Listening... tap mic again to send.' : 'Tap the mic to ask a question.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleSpeech}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/20 mt-1 mr-2"
            >
              <Feather name={isSpeechEnabled ? 'volume-2' : 'volume-x'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/20 mt-1"
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
      >
        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            className={`rounded-2xl p-4 mb-3 ${
              message.role === 'user'
                ? 'bg-emerald-600 ml-10'
                : 'bg-white border border-slate-100 mr-10'
            }`}
          >
            <Text
              className={
                message.role === 'user'
                  ? 'text-white font-semibold'
                  : 'text-slate-700 font-semibold'
              }
            >
              {message.text}
            </Text>
            {message.role === 'ai' && index === latestAiIndex ? (
              <View className="mt-3 flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => speakReply(message.text)}
                  disabled={!isSpeechEnabled || isSpeaking}
                  className="h-9 flex-row items-center justify-center gap-2 rounded-full bg-emerald-50 px-3"
                  style={{ opacity: !isSpeechEnabled || isSpeaking ? 0.45 : 1 }}
                >
                  <Feather name="repeat" size={14} color={C.emerald600} />
                  <Text className="text-xs font-black text-emerald-700">Replay</Text>
                </TouchableOpacity>
                {isSpeaking ? <Text className="text-xs font-bold text-emerald-700">Speaking...</Text> : null}
              </View>
            ) : null}
          </View>
        ))}

        {interimText !== '' && (isRecording || isSending) && (
          <View className="rounded-2xl p-4 mb-3 bg-emerald-50 border border-emerald-200 mr-10">
            <Text className="text-emerald-700 font-medium italic">{interimText}</Text>
          </View>
        )}
      </ScrollView>

      <View className="items-center pb-2 pt-1">
        <Waveform active={isRecording} level={normalizedLevel} />
      </View>

      <View className="px-4 pb-5 pt-1 bg-slate-50">
        <View className="flex-row items-center justify-center mb-3">
          <Animated.View style={isRecording ? undefined : idleStyle}>
            <MicButton listening={isRecording} onPress={handleMicPress} level={normalizedLevel} />
          </Animated.View>
        </View>

        {!isSpeechEnabled ? (
          <TouchableOpacity
            onPress={toggleSpeech}
            className="mb-3 min-h-[44px] flex-row items-center justify-center gap-2 rounded-2xl bg-slate-200"
          >
            <Feather name="volume-x" size={17} color="#475569" />
            <Text className="font-black text-slate-600">Speech muted</Text>
          </TouchableOpacity>
        ) : latestAiMessage && isSpeaking ? (
          <TouchableOpacity
            onPress={() => void stopSpeaking().then(() => setIsSpeaking(false))}
            className="mb-3 min-h-[44px] flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-50"
          >
            <Feather name="volume-2" size={17} color={C.emerald600} />
            <Text className="font-black text-emerald-700">Speaking...</Text>
          </TouchableOpacity>
        ) : null}

        <View className="bg-white rounded-2xl border border-slate-200 p-2 flex-row items-center">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Optional: type instead of speaking"
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-900 px-3"
            editable={!isSending}
            onSubmitEditing={ask}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={ask}
            disabled={isSending}
            className="w-11 h-11 rounded-full bg-emerald-600 items-center justify-center ml-2"
            style={{ opacity: isSending ? 0.5 : 1 }}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
