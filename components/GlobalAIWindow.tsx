import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatGeneral } from '../services/geminiService';
import { startListening, stopListening, speakText, stopSpeaking, isSpeechSupported } from '../services/speechService';
import { Button, MarkdownText, Card } from './UIComponents';

export const GlobalAIWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'global-init',
      role: 'model',
      text: 'Hallo! Ich bin dein FISI-Assistent. Frag mich alles zur IT-Systemintegration!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [interimInput, setInterimInput] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(false);
  const speechSupported = isSpeechSupported();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, interimInput]);

  // Handle auto-speak for new model messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (isOpen && isSoundOn && lastMsg.role === 'model' && lastMsg.id !== 'global-init') {
      speakText(lastMsg.text);
    }
  }, [messages, isSoundOn, isOpen]);

  // Stop speaking when closed
  useEffect(() => {
    if (!isOpen) stopSpeaking();
  }, [isOpen]);

  const toggleWindow = () => setIsOpen(!isOpen);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    stopSpeaking();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatGeneral(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
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

  const displayValue = isListening ? (input + (input && !input.endsWith(' ') ? ' ' : '') + interimInput) : input;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          <Card className="flex-1 flex flex-col bg-surface/90 backdrop-blur-xl border-primary/30 shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Header */}
            <div className="bg-primary/20 px-4 py-3 border-b border-primary/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-bold text-white text-sm">FISI Assistent</span>
              </div>
              
              <div className="flex items-center gap-3">
                {speechSupported && (
                  <button 
                    onClick={toggleSound}
                    className={`transition-colors ${isSoundOn ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
                    title={isSoundOn ? "Ton aus" : "Ton an"}
                  >
                     {isSoundOn ? (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                     ) : (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                     )}
                  </button>
                )}
                <button onClick={toggleWindow} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-200'}`}>
                    {m.role === 'model' ? <MarkdownText content={m.text} /> : <p>{m.text}</p>}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-dark/50 border-t border-slate-700 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  autoFocus
                  value={displayValue}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Spreche jetzt..." : "Frag mich was..."}
                  className={`w-full bg-surface border border-slate-600 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-primary transition-all ${isListening ? 'border-primary ring-1 ring-primary/50' : ''}`}
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                )}
              </div>
              <button 
                type="submit" 
                disabled={loading || (!input.trim() && !isListening)}
                className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-sky-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={toggleWindow}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-dark border border-slate-700' : 'bg-primary hover:scale-110'}`}
      >
        {isOpen ? (
           <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary animate-ping"></div>
          </div>
        )}
      </button>
    </div>
  );
};