import React, { useState, useRef, useEffect } from 'react';
import { Lernfeld, ChatMessage } from '../types';
import { chatWithTutor } from '../services/geminiService';
import { startListening, stopListening, speakText, stopSpeaking, isSpeechSupported } from '../services/speechService';
import { Button, Card, MarkdownText } from './UIComponents';

interface ChatViewProps {
  lernfeld: Lernfeld;
  onInteraction: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ lernfeld, onInteraction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `Hallo! Ich bin dein KI-Tutor für Lernfeld ${lernfeld.id}. Hast du Fragen zu "${lernfeld.title}"?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [interimInput, setInterimInput] = useState(''); // Text currently being spoken
  const [isSoundOn, setIsSoundOn] = useState(false);
  const speechSupported = isSpeechSupported();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimInput]); // Also scroll when dictating

  // Handle auto-speak for new model messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (isSoundOn && lastMsg.role === 'model' && lastMsg.id !== 'init') {
      speakText(lastMsg.text);
    }
  }, [messages, isSoundOn]);

  // Stop speaking when unmounting or switching tabs
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const sendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || input;
    
    if (!textToSend.trim() || loading) return;

    onInteraction();
    stopSpeaking(); // Stop any current speech when user sends new message

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await chatWithTutor(history, userMsg.text, lernfeld);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      // Error is handled in service
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      setInterimInput('');
    } else {
      setIsListening(true);
      startListening(
        (text, isFinal) => {
          if (isFinal) {
             setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
             setInterimInput('');
          } else {
             setInterimInput(text);
          }
        },
        () => {
           setIsListening(false);
           setInterimInput('');
        },
        (err) => console.log("Mic error", err)
      );
    }
  };

  const toggleSound = () => {
    const newState = !isSoundOn;
    setIsSoundOn(newState);
    if (!newState) stopSpeaking();
  };

  // Determine what to show in the input
  const displayValue = isListening ? (input + (input && !input.endsWith(' ') ? ' ' : '') + interimInput) : input;

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh]">
      {/* Tutor Header / Avatar Area */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-surface/50 border border-slate-700/50 rounded-xl backdrop-blur-sm shadow-lg">
        {/* Animated Avatar */}
        <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${loading ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'border-slate-700 bg-slate-800'}`}>
           <svg className={`w-7 h-7 transition-colors duration-300 ${loading ? 'text-primary' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v.01" />
           </svg>
           {/* Eyes glow when thinking */}
           {loading && (
             <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-8 h-1 bg-primary blur-md opacity-50 animate-pulse"></div>
           )}
        </div>

        {/* Tutor Identity & Status */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm">KI-Tutor <span className="text-slate-500 font-normal ml-1 text-xs hidden sm:inline">Systemintegration</span></h3>
          <div className="flex items-center gap-1.5 mt-0.5">
             <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${loading ? 'bg-primary animate-ping' : 'bg-green-500'}`}></span>
             <span className={`w-1.5 h-1.5 rounded-full absolute transition-colors duration-300 ${loading ? 'bg-primary' : 'bg-green-500'}`}></span>
             <p className="text-xs text-slate-400 transition-all duration-300 ml-2">
               {loading ? <span className="text-primary font-medium animate-pulse">Analysiert Anfrage...</span> : 'Bereit'}
             </p>
          </div>
        </div>

        {/* Sound Toggle */}
         {speechSupported && (
           <button 
             onClick={toggleSound}
             className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border ${isSoundOn ? 'bg-primary/20 text-primary border-primary/30' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-800'}`}
             title={isSoundOn ? "Vorlesen deaktivieren" : "Antworten vorlesen"}
           >
             {isSoundOn ? (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
             ) : (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
             )}
           </button>
         )}
      </div>

      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
             {/* Show mini avatar next to model messages */}
            {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-surface border border-slate-700 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
            )}

            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none shadow-primary/10' 
                  : 'bg-surface border border-slate-700 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? <MarkdownText content={msg.text} /> : <p>{msg.text}</p>}
              <span className="text-[10px] opacity-50 mt-1 block text-right">
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="w-8 h-8 rounded-full bg-surface border border-slate-700 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1 animate-pulse">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div className="bg-surface border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </Card>
      
      <form onSubmit={(e) => sendMessage(e)} className="mt-4 flex gap-2">
        <div className="flex-1 relative">
           <input
            type="text"
            value={displayValue}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Ich höre zu..." : "Stelle eine Frage..."}
            className={`w-full bg-surface border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${isListening ? 'border-primary ring-1 ring-primary/50' : ''}`}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="Spracheingabe"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </div>
        
        <Button 
            disabled={loading || (!input.trim() && !isListening)} 
            onClick={() => sendMessage()}
            className="w-14 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </Button>
      </form>
    </div>
  );
};