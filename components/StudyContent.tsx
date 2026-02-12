import React, { useState, useEffect } from 'react';
import { Lernfeld, GeneratedContent } from '../types';
import { generateStudyContent } from '../services/geminiService';
import { Loader, Button, MarkdownText, Card } from './UIComponents';

interface StudyContentProps {
  lernfeld: Lernfeld;
  onComplete: () => void;
}

export const StudyContent: React.FC<StudyContentProps> = ({ lernfeld, onComplete }) => {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lernfeld.id]);

  const loadContent = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await generateStudyContent(lernfeld);
      setContent(data);
      onComplete(); // Mark as seen
    } catch (err) {
      setError('Inhalte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-96 flex flex-col items-center justify-center"><Loader /><p className="text-slate-400 mt-4 animate-pulse">Analysiere Lernfeld und erstelle Zusammenfassung...</p></div>;
  if (error) return <div className="p-4 bg-red-900/20 text-red-200 rounded-lg border border-red-500/50">{error}<Button onClick={loadContent} className="mt-4" variant="outline">Neu laden</Button></div>;
  if (!content) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Zusammenfassung
        </h2>
        <div className="text-slate-300 leading-relaxed">
          <MarkdownText content={content.summary} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-surface to-slate-800">
          <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16.464a2 2 0 01-1.07.472L6 18l.8-4.4a2.2 0 01.472-1.07l6.392-6.392A6 6 0 0115 7z" /></svg>
            Schlüsselbegriffe
          </h3>
          <ul className="space-y-2">
            {content.keyConcepts.map((concept, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-secondary mt-1">•</span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-surface to-slate-800">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Praxisaufgabe
          </h3>
          <p className="text-slate-300 italic border-l-4 border-green-500/50 pl-4 py-1">
            "{content.practiceTask}"
          </p>
        </Card>
      </div>
    </div>
  );
};