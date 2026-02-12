import React, { useState, useEffect } from 'react';
import { Lernfeld, QuizQuestion } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { speakText, stopSpeaking, isSpeechSupported } from '../services/speechService';
import { Loader, Button, Card } from './UIComponents';

interface QuizViewProps {
  lernfeld: Lernfeld;
  onComplete: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ lernfeld, onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lernfeld.id]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const loadQuiz = async () => {
    stopSpeaking();
    setLoading(true);
    setError('');
    try {
      const data = await generateQuizQuestions(lernfeld);
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setScore(0);
      setCompleted(false);
      setIsAnswered(false);
      setSelectedOption(null);
    } catch (err) {
      setError('Quiz konnte nicht geladen werden. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentQuestionIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    stopSpeaking();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
      onComplete(); // Mark as finished
    }
  };

  const readQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeaking();
    const q = questions[currentQuestionIndex];
    let text = `Frage: ${q.question}. `;
    q.options.forEach((opt, idx) => {
       text += `Antwort ${String.fromCharCode(65 + idx)}: ${opt}. `;
    });
    speakText(text);
  };

  const readExplanation = (e: React.MouseEvent) => {
      e.stopPropagation();
      stopSpeaking();
      const q = questions[currentQuestionIndex];
      speakText(`Erklärung: ${q.explanation}`);
  };

  if (loading) return <div className="h-64 flex flex-col items-center justify-center"><Loader /><p className="text-slate-400 mt-4">Generiere Prüfungsfragen...</p></div>;
  if (error) return <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg">{error}<Button onClick={loadQuiz} className="mt-4" variant="outline">Erneut versuchen</Button></div>;
  if (questions.length === 0) return <div>Keine Fragen gefunden.</div>;

  if (completed) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto mt-8">
        <h2 className="text-3xl font-bold mb-4 text-white">Ergebnis</h2>
        <div className="text-6xl font-bold text-primary mb-6">
          {score} / {questions.length}
        </div>
        <p className="text-slate-300 mb-8">
          {score === questions.length ? 'Perfekt! Du bist ein Profi.' : 
           score > questions.length / 2 ? 'Gut gemacht! Weiter so.' : 'Da ist noch Luft nach oben.'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={loadQuiz} variant="primary">Neues Quiz generieren</Button>
        </div>
      </Card>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono text-sm">Frage {currentQuestionIndex + 1} / {questions.length}</span>
        </div>
        <span className="text-primary font-mono text-sm">Score: {score}</span>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start gap-4 mb-6">
            <h3 className="text-xl font-medium text-white leading-relaxed flex-1">{currentQ.question}</h3>
            {speechSupported && (
                <button 
                    onClick={readQuestion}
                    className="flex-shrink-0 text-primary hover:text-white bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-all"
                    title="Frage vorlesen"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </button>
            )}
        </div>
        
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";
            
            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                btnClass += "bg-green-500/20 border-green-500 text-green-100";
              } else if (idx === selectedOption) {
                btnClass += "bg-red-500/20 border-red-500 text-red-100";
              } else {
                btnClass += "bg-surface border-slate-700 text-slate-500 opacity-50";
              }
            } else {
               btnClass += "bg-surface border-slate-700 hover:border-primary hover:bg-slate-700/50 text-slate-200";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono opacity-50">{String.fromCharCode(65 + idx)}.</span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6 relative group">
            <div className="flex justify-between items-start mb-2">
                 <strong className="block text-blue-200 text-sm">Erklärung:</strong>
                 {speechSupported && (
                    <button 
                        onClick={readExplanation}
                        className="text-blue-400 hover:text-white transition-colors p-1"
                        title="Erklärung vorlesen"
                    >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                 )}
            </div>
            <p className="text-blue-200 text-sm">{currentQ.explanation}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={nextQuestion}>
              {currentQuestionIndex === questions.length - 1 ? 'Ergebnis anzeigen' : 'Nächste Frage'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};