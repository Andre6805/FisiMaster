// Type definitions for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const getSpeechRecognition = () => {
  const win = window as unknown as IWindow;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
};

export const isSpeechSupported = (): boolean => {
  return !!getSpeechRecognition() && !!window.speechSynthesis;
};

// Helper to remove markdown symbols for smoother speech
const cleanMarkdownForSpeech = (text: string): string => {
  return text
    .replace(/[*#_`~]/g, '') // Remove formatting chars
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove url
    .replace(/^\s*-\s/gm, '') // Remove list bullets
    .replace(/\n/g, '. '); // Replace newlines with pauses
};

let synthesis: SpeechSynthesisUtterance | null = null;
let recognition: any | null = null;

export const speakText = (text: string) => {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = cleanMarkdownForSpeech(text);
  synthesis = new SpeechSynthesisUtterance(cleanText);
  synthesis.lang = 'de-DE';
  synthesis.rate = 1.0;
  synthesis.pitch = 1.0;

  // Try to find a good German voice
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find(v => v.lang.includes('de') && !v.name.includes('Google')) || voices.find(v => v.lang.includes('de'));
  if (germanVoice) {
    synthesis.voice = germanVoice;
  }

  window.speechSynthesis.speak(synthesis);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const startListening = (
  onResult: (text: string, isFinal: boolean) => void, 
  onEnd: () => void,
  onError: (error: string) => void
) => {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    onError("Browser unterstützt keine Spracherkennung.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'de-DE';
  recognition.continuous = false; // Keep false to avoid endless listening, but UI handles interim
  recognition.interimResults = true; // ENABLE real-time feedback

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    }
    if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    // Ignore 'no-speech' errors as they just mean silence
    if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        onError(event.error);
    }
    onEnd();
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch (e) {
    console.error(e);
    onEnd();
  }
};

export const stopListening = () => {
  if (recognition) {
    recognition.stop();
  }
};