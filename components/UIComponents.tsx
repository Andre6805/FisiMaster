import React from 'react';

export const Loader = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button'
}: { 
  children?: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary hover:bg-sky-400 text-white shadow-lg shadow-primary/20",
    secondary: "bg-secondary hover:bg-indigo-400 text-white shadow-lg shadow-secondary/20",
    outline: "border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white bg-transparent",
    danger: "bg-red-500 hover:bg-red-400 text-white"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-surface border border-slate-700/50 rounded-xl shadow-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export const MarkdownText = ({ content }: { content: string }) => {
  // Simple replacement for newlines and basic markdown headers for safety if no library used
  // In a real app, use react-markdown. Here we do simple formatting.
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-sky-300 mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-4">{line.replace('# ', '')}</h1>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-300 mb-1">{line.replace('- ', '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      
      // Bold handling
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-slate-300 mb-2 leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return <div className="prose prose-invert max-w-none">{formatText(content)}</div>;
};