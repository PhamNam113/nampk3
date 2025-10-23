import React, { useState, useCallback } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formContent: string;
  answerContent: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, title, formContent, answerContent }) => {
  const [formCopied, setFormCopied] = useState(false);
  const [answerCopied, setAnswerCopied] = useState(false);

  const handleCopy = useCallback(async (content: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Không thể sao chép nội dung.');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95" onClick={(e) => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-slate-700">Dữ liệu cho Google Form (Câu hỏi & Lựa chọn)</label>
                <button onClick={() => handleCopy(formContent, setFormCopied)} className={`px-3 py-1 text-sm text-white rounded-md transition-colors ${formCopied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    <i className={`fa-solid ${formCopied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {formCopied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
            </div>
            <textarea
              readOnly
              value={formContent}
              className="w-full h-40 p-3 bg-slate-100 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nội dung câu hỏi và các lựa chọn sẽ xuất hiện ở đây..."
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-slate-700">Đáp án & Giải thích</label>
                <button onClick={() => handleCopy(answerContent, setAnswerCopied)} className={`px-3 py-1 text-sm text-white rounded-md transition-colors ${answerCopied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    <i className={`fa-solid ${answerCopied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {answerCopied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
            </div>
            <textarea
              readOnly
              value={answerContent}
              className="w-full h-40 p-3 bg-slate-100 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Đáp án và giải thích sẽ xuất hiện ở đây..."
            />
          </div>
        </main>
        <footer className="p-4 bg-slate-50 border-t border-slate-200 text-right rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-semibold">Đóng</button>
        </footer>
      </div>
    </div>
  );
};
