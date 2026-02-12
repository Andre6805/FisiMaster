import React, { useState } from 'react';
import { Button, Card } from './UIComponents';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Feedback received:", text);
    setIsSubmitting(false);
    setIsSuccess(true);
    setText('');
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-darker/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 relative bg-surface border-slate-700 shadow-2xl">
        {isSuccess ? (
          <div className="text-center py-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vielen Dank!</h3>
            <p className="text-slate-400 mb-6">Wir haben Ihr Feedback erhalten und werden es prüfen.</p>
            <Button onClick={handleClose} className="w-full">Schließen</Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Feedback geben</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-slate-400 mb-4">
                Haben Sie einen Fehler gefunden oder einen Verbesserungsvorschlag? Lassen Sie es uns wissen!
              </p>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ihr Feedback..."
                className="w-full h-32 bg-dark border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all mb-4 resize-none"
                required
              />
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} type="button">Abbrechen</Button>
                <Button disabled={isSubmitting || !text.trim()} type="submit">
                  {isSubmitting ? 'Senden...' : 'Absenden'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};