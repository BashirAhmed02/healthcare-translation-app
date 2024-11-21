'use client'; // Mark this file as a client component

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select'; // Import react-select

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [inputLanguage, setInputLanguage] = useState('en-US'); // Default to English for input
  const [targetLanguage, setTargetLanguage] = useState('es'); // Default to Spanish for output
  const [isClient, setIsClient] = useState(false); // Client check for hydration
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Language map with flag URL and language codes
  const languageMap: { [key: string]: { label: string; recognition: string; synthesis: string; flagUrl: string } } = {
    'en-US': { label: 'English', recognition: 'en-US', synthesis: 'en-US', flagUrl: 'https://flagcdn.com/w320/gb.png' },
    'es': { label: 'Spanish', recognition: 'es-ES', synthesis: 'es-ES', flagUrl: 'https://flagcdn.com/w320/es.png' },
    'fr': { label: 'French', recognition: 'fr-FR', synthesis: 'fr-FR', flagUrl: 'https://flagcdn.com/w320/fr.png' },
    'de': { label: 'German', recognition: 'de-DE', synthesis: 'de-DE', flagUrl: 'https://flagcdn.com/w320/de.png' },
    'zh': { label: 'Chinese', recognition: 'zh-CN', synthesis: 'zh-CN', flagUrl: 'https://flagcdn.com/w320/cn.png' },
    'hi': { label: 'Hindi', recognition: 'hi-IN', synthesis: 'hi-IN', flagUrl: 'https://flagcdn.com/w320/in.png' },
    'ar': { label: 'Arabic', recognition: 'ar-SA', synthesis: 'ar-SA', flagUrl: 'https://flagcdn.com/w320/sa.png' },
    'ja': { label: 'Japanese', recognition: 'ja-JP', synthesis: 'ja-JP', flagUrl: 'https://flagcdn.com/w320/jp.png' },
    'ko': { label: 'Korean', recognition: 'ko-KR', synthesis: 'ko-KR', flagUrl: 'https://flagcdn.com/w320/kr.png' },
  };

  // Convert languageMap to format suitable for react-select
  const languageOptions = Object.entries(languageMap).map(([code, { label, flagUrl }]) => ({
    value: code,
    label: (
      <div className="flex items-center">
        <img src={flagUrl} alt={label} className="mr-2" style={{ width: '20px', height: '15px' }} />
        {label}
      </div>
    ),
  }));

  useEffect(() => {
    setIsClient(true); // Mark the component as mounted on the client

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognitionRef.current.lang = inputLanguage; // Set the input language dynamically
      recognitionRef.current.interimResults = false;
    }
  }, [inputLanguage]); // Reinitialize recognition when the input language changes

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Speech Recognition API is not supported in this browser.');
      return;
    }

    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.onerror = (error) => {
      console.error('Speech Recognition Error:', error);
      alert('An error occurred during speech recognition. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const translateText = async () => {
    if (!transcript) {
      alert('Please record something first!');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Translate the following text to ${targetLanguage}: "${transcript}"`,
            },
          ],
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setTranslatedText(response.data.choices[0].message.content.trim());
    } catch (error) {
      console.error('Translation Error:', error);
      alert('An error occurred during translation.');
    }
  };

  const speakText = (text: string, lang: string) => {
    if (!text) {
      alert('No text to speak!');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Avoid rendering anything on the server
  if (!isClient) {
    return <div className="text-center mt-20">Loading...</div>; // Show a loading indicator
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 sm:p-20">
      <h1 className="text-3xl font-bold text-blue-500 mb-8">Healthcare Translation App</h1>
      <div className="flex flex-col items-center gap-4">
        {/* Input Language Selector */}
        <div className="flex gap-4 items-center">
          <label htmlFor="input-language" className="text-gray-700">
            Input Language:
          </label>
          <Select
            id="input-language"
            options={languageOptions}
            value={languageOptions.find((option) => option.value === inputLanguage)}
            onChange={(selectedOption) => setInputLanguage(selectedOption?.value || '')}
            className="w-48"
          />
        </div>

        {/* Start/Stop Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-2 rounded text-white ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {/* Transcription Output */}
        <div className="w-full max-w-2xl p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Transcript:</h2>
          <p className="text-gray-700">{transcript || 'No speech detected yet.'}</p>
        </div>

        {/* Output Language Selector */}
        <div className="flex gap-4 items-center">
          <label htmlFor="output-language" className="text-gray-700">
            Translate to:
          </label>
          <Select
            id="output-language"
            options={languageOptions}
            value={languageOptions.find((option) => option.value === targetLanguage)}
            onChange={(selectedOption) => setTargetLanguage(selectedOption?.value || '')}
            className="w-48"
          />
        </div>

        {/* Translate Button */}
        <button
          onClick={translateText}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Translate
        </button>

        {/* Translated Text Output */}
        <div className="w-full max-w-2xl p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Translated Text:</h2>
          <p className="text-gray-700">{translatedText || 'No translation yet.'}</p>
        </div>

        {/* Speak Translated Text Button */}
        <button
          onClick={() => speakText(translatedText, languageMap[targetLanguage].synthesis)}
          className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded"
        >
          Speak Translated Text
        </button>
      </div>
    </div>
  );
}
