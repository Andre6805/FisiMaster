
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  STUDY = 'STUDY'
}

export enum StudyTab {
  CONTENT = 'CONTENT',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT'
}

export interface Lernfeld {
  id: number;
  title: string;
  description: string;
  year: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GeneratedContent {
  summary: string;
  keyConcepts: string[];
  practiceTask: string;
}

export interface LernfeldProgress {
  contentSeen: boolean;
  quizDone: boolean;
  chatStarted: boolean;
}

export type AllProgress = Record<number, LernfeldProgress>;

export interface Reminder {
  id: string;
  text: string;
  targetTime: number; // timestamp
  seen: boolean;
}
