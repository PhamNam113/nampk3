import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
}

const optionLabels = ['A', 'B', 'C', 'D'];

const getDifficultyClass = (difficulty: string) => {
    switch(difficulty) {
        case 'Nhận biết':
            return 'bg-green-100 text-green-800';
        case 'Thông hiểu':
            return 'bg-yellow-100 text-yellow-800';
        case 'Vận dụng':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-slate-100 text-slate-800';
    }
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transition-shadow hover:shadow-xl">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
                <i className="fa-solid fa-book-open text-xl text-blue-500 mr-3"></i>
                <h3 className="text-lg font-bold text-slate-800">
                    Câu {index + 1}
                </h3>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyClass(question.difficulty)}`}>
                {question.difficulty}
            </span>
        </div>

        <p className="text-slate-700 mb-5 text-base leading-relaxed">{question.question}</p>

        <div className="space-y-3 mb-5">
            {question.options.map((option, optIndex) => (
                <div 
                    key={optIndex} 
                    className={`p-3 border rounded-lg flex items-center
                        ${optIndex === question.correctAnswerIndex 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                >
                    <span 
                        className={`font-bold mr-3
                            ${optIndex === question.correctAnswerIndex ? 'text-blue-600' : 'text-slate-600'}`
                        }
                    >
                        {optionLabels[optIndex]}.
                    </span>
                    <span className="text-slate-800">{option}</span>
                </div>
            ))}
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
            <p className="font-semibold text-slate-700">
                <i className="fa-solid fa-key mr-2 text-green-600"></i>
                Đáp án đúng: <span className="font-bold text-blue-600">{optionLabels[question.correctAnswerIndex]}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600 leading-normal">
                <i className="fa-solid fa-circle-info mr-2 text-sky-600"></i>
                <span className="font-semibold">Giải thích:</span> {question.explanation}
            </p>
        </div>
    </div>
  );
};