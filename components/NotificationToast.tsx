
import React from 'react';
import { Reminder } from '../types';

export const NotificationToast = ({ reminder, onClose }: { reminder: Reminder, onClose: () => void }) => {
    return (
        <div className="fixed top-20 right-4 z-[250] w-80 bg-surface/95 backdrop-blur border border-primary/50 shadow-2xl rounded-xl p-4 animate-in slide-in-from-right duration-500 flex flex-col gap-2 ring-1 ring-primary/20">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    Lern-Erinnerung!
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div>
                 <p className="text-white font-medium">{reminder.text}</p>
                 <p className="text-slate-400 text-xs mt-1">Es ist Zeit, weiterzumachen.</p>
            </div>
            <button onClick={onClose} className="mt-2 text-xs text-center w-full py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                Okay, verstanden
            </button>
        </div>
    )
}
