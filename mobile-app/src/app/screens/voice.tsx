import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withRepeat, withSequence, cancelAnimation, Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { C } from '../../constants/colors';
import { useStore } from '../../store';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { MicButton } from '../../components/voice/MicButton';
import { Waveform } from '../../components/voice/Waveform';
import { createVoiceSocket, endpoints } from '../../services/api';

type ChatMessage = { role: 'ai' | 'user'; text: string };

export default function VoiceScreen() {
  const router = useRouter();
  const occupation = useStore((s) => s.occupation);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Ask about loans, expenses, mandi prices, udhar, orders or shift payments. Tap the mic to speak.',
    },
  ]);
  const [interimText, setInterimText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  
  const voiceSocketRef = useRef<ReturnType<typeof createVoiceSocket> | null>(null);

  const { start, stop, normalizedLevel, isRecording } = useAudioRecorder();

  const idlePulse = useSharedValue(1);
  useEffect(() => {
    if (!isRecording) {
      idlePulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(idlePulse);
      idlePulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const idleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: idlePulse.value }],
  }));

  const ask = async () => {
    if (!prompt.trim()) return;
    
    // Optimistically add user text
    const text = prompt.trim();
    setMessages((current) => [...current, { role: 'user', text }]);
    setPrompt('');
    setInterimText('Thinking...');
    
    try {
      const res = await endpoints.financialGuidance(text, 'en');
      // res might be { data: { ... } } or just data because of unwrapper
      const reply = res.data?.responseText || res.data?.response || res.data || "I couldn't process that.";
      
      setMessages((current) => [...current, { role: 'ai', text: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
    } catch (err) {
      setMessages((current) => [...current, { role: 'ai', text: 'Error connecting to AI text service.' }]);
    } finally {
      setInterimText('');
    }
  };

  const processAudioRecording = async (audioUri: string) => {
    setInterimText('Connecting...');
    
    const socket = createVoiceSocket({
      onConnected: () => {
        socket.start({ filename: 'recording.m4a', mimeType: 'audio/m4a' });
      },
      onReady: async () => {
        setInterimText('Uploading audio...');
        try {
          const response = await fetch(audioUri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            if (buffer) {
              socket.sendChunk(buffer);
              socket.end();
            }
          };
          reader.readAsArrayBuffer(blob);
        } catch (err) {
          setInterimText('Error reading audio file.');
          socket.close();
        }
      },
      onProcessing: () => setInterimText('Thinking...'),
      onResponse: (payload) => {
        if (payload?.transcript) {
          setMessages((current) => [
            ...current,
            { role: 'user', text: payload.transcript },
            { role: 'ai', text: payload.responseText || 'Received audio response.' },
          ]);
        } else {
          setMessages((current) => [
            ...current,
            { role: 'ai', text: payload?.responseText || 'Done processing audio.' },
          ]);
        }
        setInterimText('');
        socket.close();
        voiceSocketRef.current = null;
      },
      onError: (err) => {
        setInterimText('Error: ' + err);
        socket.close();
        voiceSocketRef.current = null;
      }
    });

    voiceSocketRef.current = socket;
  };

  const handleMicPress = async () => {
    if (isRecording) {
      const uri = await stop();
      if (uri) {
        processAudioRecording(uri);
      } else {
        setInterimText('');
      }
    } else {
      setInterimText('Listening…');
      await start();
    }
  };

  useEffect(() => {
    if (!isRecording) return;
    if (normalizedLevel > 0.15) {
      setInterimText('Listening…');
    }
  }, [normalizedLevel, isRecording]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, interimText]);

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
                {isRecording ? 'Listening to your voice…' : 'Tap the mic to ask a question.'}
              </Text>
            </View>
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
          </View>
        ))}

        {interimText !== '' && isRecording && (
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

        <View className="bg-white rounded-2xl border border-slate-200 p-2 flex-row items-center">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Or type your question here"
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-900 px-3"
          />
          <TouchableOpacity
            onPress={ask}
            className="w-11 h-11 rounded-full bg-emerald-600 items-center justify-center ml-2"
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
