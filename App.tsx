import React, { useState, useEffect } from 'react';
import { LERNFELDER } from './constants';
import { Lernfeld, ViewState, StudyTab, AllProgress, LernfeldProgress, Reminder } from './types';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { StudyContent } from './components/StudyContent';
import { GlobalAIWindow } from './components/GlobalAIWindow';
import { FeedbackModal } from './components/FeedbackModal';
import { ReminderManager } from './components/ReminderManager';
import { NotificationToast } from './components/NotificationToast';
import { checkApiKey } from './services/geminiService';

const STORAGE_KEY = 'fisi_master_progress';
const REMINDERS_KEY = 'fisi_master_reminders';

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedLernfeld, setSelectedLernfeld] = useState<Lernfeld | null>(null);
  const [activeTab, setActiveTab] = useState<StudyTab>(StudyTab.CONTENT);
  const [progress, setProgress] = useState<AllProgress>({});
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Reminder State
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderManagerOpen, setIsReminderManagerOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Reminder | null>(null);

  const apiKeyExists = checkApiKey();

  // Load progress and reminders from localStorage on init
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }

    const savedReminders = localStorage.getItem(REMINDERS_KEY);
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch (e) {
        console.error("Failed to parse reminders", e);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }, [reminders]);

  // Check for due reminders every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dueReminder = reminders.find(r => !r.seen && r.targetTime <= now);
      
      if (dueReminder) {
        setActiveNotification(dueReminder);
        // Mark as seen immediately so it doesn't trigger again
        setReminders(prev => prev.map(r => r.id === dueReminder.id ? { ...r, seen: true } : r));
        
        // Play subtle sound
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple beep
            audio.volume = 0.2;
            audio.play().catch(() => {}); // Ignore interaction errors
        } catch (e) {}
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders]);

  const addReminder = (text: string, date: Date) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text,
      targetTime: date.getTime(),
      seen: false
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  const resetProgress = () => {
    if (window.confirm('Möchtest du wirklich den gesamten Lernfortschritt zurücksetzen? Dies kann nicht rückgängig gemacht werden.')) {
      setProgress({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updateProgress = (lfId: number, update: Partial<LernfeldProgress>) => {
    setProgress(prev => {
      const current = prev[lfId] || { contentSeen: false, quizDone: false, chatStarted: false };
      return {
        ...prev,
        [lfId]: { ...current, ...update }
      };
    });
  };

  const calculatePercentage = (lfId: number) => {
    const p = progress[lfId];
    if (!p) return 0;
    let count = 0;
    if (p.contentSeen) count++;
    if (p.quizDone) count++;
    if (p.chatStarted) count++;
    return Math.round((count / 3) * 100);
  };

  const handleLernfeldClick = (lf: Lernfeld) => {
    setSelectedLernfeld(lf);
    setView(ViewState.STUDY);
    setActiveTab(StudyTab.CONTENT);
  };

  const goBack = () => {
    setView(ViewState.DASHBOARD);
    setSelectedLernfeld(null);
  };

  if (!apiKeyExists) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-surface p-8 rounded-xl border border-red-500/30 shadow-2xl max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">API Key fehlt</h1>
          <p className="text-slate-400 mb-6">
            Bitte fügen Sie einen gültigen <code>API_KEY</code> zur Umgebung hinzu, um die App zu starten.
            Diese App benötigt die Gemini API für die Generierung von Lerninhalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker text-slate-200 font-sans selection:bg-primary/30 selection:text-white">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={goBack}>
            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg shadow-lg shadow-primary/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              FISI <span className="text-primary">Master</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {view === ViewState.STUDY && selectedLernfeld && (
              <div className="hidden md:flex items-center gap-2 text-sm font-mono text-slate-400 border-r border-slate-700 pr-4 mr-1">
                <span>Lernfeld {selectedLernfeld.id}</span>
                <span className="bg-slate-700/50 px-2 py-1 rounded text-xs border border-slate-600">Jahr {selectedLernfeld.year}</span>
              </div>
            )}
            
            <button 
              onClick={() => setIsReminderManagerOpen(true)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors relative"
              title="Erinnerungen"
            >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
               </svg>
               {reminders.filter(r => !r.seen && r.targetTime > Date.now()).length > 0 && (
                   <span className="absolute top-1.5 right-2 w-2 h-2 bg-secondary rounded-full border border-dark"></span>
               )}
            </button>

            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Feedback</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === ViewState.DASHBOARD && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Deine Lernfelder</h2>
                <p className="text-slate-400">Wähle ein Thema, um deine Ausbildung zum Fachinformatiker voranzutreiben.</p>
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="bg-surface/50 border border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-300">
                    Gesamtfortschritt: <span className="text-primary font-bold">
                      {Math.round(LERNFELDER.reduce((acc, lf) => acc + calculatePercentage(lf.id), 0) / LERNFELDER.length)}%
                    </span>
                  </div>
                  <button 
                    onClick={resetProgress}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 rounded-lg transition-all"
                    title="Fortschritt zurücksetzen"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LERNFELDER.map((lf) => {
                const perc = calculatePercentage(lf.id);
                return (
                  <div 
                    key={lf.id}
                    onClick={() => handleLernfeldClick(lf)}
                    className="group bg-surface border border-slate-700/50 hover:border-primary/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <span className="text-6xl font-bold text-slate-400">{lf.id}</span>
                    </div>
                    <div className="relative z-10 flex-grow">
                      <div className="flex justify-between items-start mb-3">
                          <span className="inline-block px-2 py-1 rounded bg-slate-700/50 border border-slate-600 text-xs text-primary font-mono">
                            {lf.year}. Ausbildungsjahr
                          </span>
                      </div>
                      
                      <h3 className="text-xl font-black text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                        {lf.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">
                        {lf.description}
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700/50 relative z-10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fortschritt</span>
                        <span className={`text-xs font-bold ${perc === 100 ? 'text-green-400' : 'text-primary'}`}>{perc}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${perc === 100 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${perc}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === ViewState.STUDY && selectedLernfeld && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             {/* Mobile Back Button */}
            <button onClick={goBack} className="md:hidden mb-4 flex items-center text-slate-400 hover:text-white">
               <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               Zurück zur Übersicht
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar / Tabs */}
              <div className="w-full lg:w-64 flex-shrink-0">
                 <div className="bg-surface border border-slate-700/50 rounded-xl p-2 sticky top-24 shadow-xl">
                    <nav className="flex flex-row lg:flex-col gap-1 mb-2">
                      <button 
                        onClick={() => setActiveTab(StudyTab.CONTENT)}
                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === StudyTab.CONTENT ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                      >
                         <div className="flex items-center gap-3">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                           <span className="hidden sm:inline">Lernstoff</span>
                           <span className="sm:hidden">Lernen</span>
                         </div>
                         {progress[selectedLernfeld.id]?.contentSeen && <svg className="w-4 h-4 text-white opacity-60" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </button>
                      <button 
                        onClick={() => setActiveTab(StudyTab.QUIZ)}
                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === StudyTab.QUIZ ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Quiz
                        </div>
                        {progress[selectedLernfeld.id]?.quizDone && <svg className="w-4 h-4 text-white opacity-60" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </button>
                      <button 
                        onClick={() => setActiveTab(StudyTab.CHAT)}
                        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === StudyTab.CHAT ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                      >
                         <div className="flex items-center gap-3">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                           <span className="hidden sm:inline">KI-Tutor</span>
                           <span className="sm:hidden">Tutor</span>
                         </div>
                         {progress[selectedLernfeld.id]?.chatStarted && <svg className="w-4 h-4 text-white opacity-60" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </button>
                    </nav>
                    
                    <button 
                        onClick={() => setIsReminderManagerOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-700 hover:border-slate-500"
                    >
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Erinnerung für dieses Lernfeld
                    </button>
                 </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-h-[500px]">
                 <div className="mb-6">
                   <h1 className="text-3xl font-bold text-white mb-2">{selectedLernfeld.title}</h1>
                   <p className="text-slate-400">{selectedLernfeld.description}</p>
                 </div>

                 <div className="bg-transparent">
                   {activeTab === StudyTab.CONTENT && (
                     <StudyContent 
                       lernfeld={selectedLernfeld} 
                       onComplete={() => updateProgress(selectedLernfeld.id, { contentSeen: true })} 
                     />
                   )}
                   {activeTab === StudyTab.QUIZ && (
                     <QuizView 
                       lernfeld={selectedLernfeld} 
                       onComplete={() => updateProgress(selectedLernfeld.id, { quizDone: true })}
                     />
                   )}
                   {activeTab === StudyTab.CHAT && (
                     <ChatView 
                       lernfeld={selectedLernfeld} 
                       onInteraction={() => updateProgress(selectedLernfeld.id, { chatStarted: true })}
                     />
                   )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Global AI Assistant Button/Window */}
      <GlobalAIWindow />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {/* Reminder Manager & Notification */}
      <ReminderManager 
         isOpen={isReminderManagerOpen}
         onClose={() => setIsReminderManagerOpen(false)}
         reminders={reminders}
         onAddReminder={addReminder}
         onDeleteReminder={deleteReminder}
         defaultText={selectedLernfeld ? `Lernfeld ${selectedLernfeld.id}: ${selectedLernfeld.title}` : ''}
      />
      {activeNotification && (
          <NotificationToast reminder={activeNotification} onClose={closeNotification} />
      )}
    </div>
  );
};

export default App;