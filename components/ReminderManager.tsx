
import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { Button, Card } from './UIComponents';

interface ReminderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (text: string, date: Date) => void;
  onDeleteReminder: (id: string) => void;
  defaultText?: string;
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({
  isOpen, onClose, reminders, onAddReminder, onDeleteReminder, defaultText = ''
}) => {
  const [text, setText] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(defaultText);
      // Default to 1 hour from now, rounded to next minute
      const d = new Date();
      d.setHours(d.getHours() + 1);
      d.setSeconds(0);
      d.setMilliseconds(0);
      
      const pad = (n: number) => n < 10 ? '0'+n : n;
      const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setDateStr(formatted);
    }
  }, [isOpen, defaultText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !dateStr) return;
    onAddReminder(text, new Date(dateStr));
    setText(''); 
  };

  // Sort reminders by time
  const upcoming = reminders
    .filter(r => !r.seen && r.targetTime > Date.now())
    .sort((a, b) => a.targetTime - b.targetTime);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-darker/80 backdrop-blur-sm animate-in fade-in duration-200">
        <Card className="w-full max-w-md p-6 bg-surface shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lern-Erinnerungen
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-dark/50 rounded-xl border border-slate-700">
                <h4 className="text-sm font-bold text-slate-300 mb-3">Neue Erinnerung setzen</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Was möchtest du lernen?</label>
                        <input 
                            type="text" 
                            value={text} 
                            onChange={e => setText(e.target.value)}
                            placeholder="z.B. Lernfeld 5 Zusammenfassung"
                            className="w-full bg-surface border border-slate-600 rounded p-2 text-white text-sm focus:border-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Wann?</label>
                        <input 
                            type="datetime-local" 
                            value={dateStr}
                            onChange={e => setDateStr(e.target.value)}
                            className="w-full bg-surface border border-slate-600 rounded p-2 text-white text-sm focus:border-primary focus:outline-none [color-scheme:dark]"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" variant="secondary">Speichern</Button>
                </div>
            </form>

            <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex justify-between">
                    <span>Geplant ({upcoming.length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {upcoming.length === 0 ? (
                        <p className="text-slate-500 text-sm italic text-center py-4">Keine anstehenden Erinnerungen.</p>
                    ) : (
                        upcoming.map(r => (
                            <div key={r.id} className="flex justify-between items-center p-3 bg-slate-800/50 border border-slate-700 rounded-lg group hover:border-slate-600 transition-colors">
                                <div>
                                    <div className="text-white font-medium text-sm">{r.text}</div>
                                    <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {new Date(r.targetTime).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onDeleteReminder(r.id)} 
                                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Löschen"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    </div>
  )
}
