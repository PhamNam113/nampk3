import { DIFFICULTY_LEVELS } from './constants';

export type Difficulty = typeof DIFFICULTY_LEVELS[number];

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface SavedQuestionSet {
    id: string;
    subject: string;
    grade: string;
    topic: string;
    createdAt: string; // ISO date string
    questions: Question[];
}