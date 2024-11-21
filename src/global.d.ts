// global.d.ts
interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  
  declare class SpeechRecognition {
    lang: string;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }
  
  interface SpeechRecognitionEvent {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }
  
  interface SpeechRecognitionErrorEvent {
    error: string;
  }
  