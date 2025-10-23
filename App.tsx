import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SUBJECTS, GRADES, DIFFICULTY_LEVELS, SUBJECT_IMAGES } from './constants';
import type { Question, SavedQuestionSet } from './types';
import { generateQuestions } from './services/geminiService';
import { QuestionCard } from './components/QuestionCard';
import { Spinner } from './components/Spinner';
import { ExportModal } from './components/ExportModal';

const App: React.FC = () => {
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [topic, setTopic] = useState<string>('');
  const [numQuestionsByDifficulty, setNumQuestionsByDifficulty] = useState<Record<string, number>>({
    'Nhận biết': 2,
    'Thông hiểu': 2,
    'Vận dụng': 1,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [savedSets, setSavedSets] = useState<SavedQuestionSet[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    try {
      const storedSets = localStorage.getItem('questionSets');
      if (storedSets) {
        setSavedSets(JSON.parse(storedSets));
      }
    } catch (error) {
      console.error("Failed to load saved question sets from localStorage:", error);
      // Optionally clear corrupted storage
      localStorage.removeItem('questionSets');
    }
  }, []);

  const handleDifficultyChange = (level: string, value: string) => {
    const count = Math.max(0, Math.min(10, parseInt(value, 10) || 0));
    setNumQuestionsByDifficulty(prev => ({
      ...prev,
      [level]: count,
    }));
  };

  const totalQuestions = Object.values(numQuestionsByDifficulty).reduce((sum, count) => sum + count, 0);

  const handleGenerateQuestions = useCallback(async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề.');
      return;
    }
    if (totalQuestions === 0) {
        setError('Vui lòng nhập số lượng câu hỏi lớn hơn 0.');
        return;
    }
    if (totalQuestions > 20) {
        setError('Tổng số câu hỏi không được vượt quá 20.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const generatedQuestions = await generateQuestions(subject, grade, topic, numQuestionsByDifficulty);
      setQuestions(generatedQuestions);
      
      // Save the new question set
      if (generatedQuestions.length > 0) {
        const newSet: SavedQuestionSet = {
          id: Date.now().toString(),
          subject,
          grade,
          topic,
          createdAt: new Date().toISOString(),
          questions: generatedQuestions,
        };
        
        const updatedSets = [newSet, ...savedSets];
        setSavedSets(updatedSets);
        localStorage.setItem('questionSets', JSON.stringify(updatedSets));
      }

    } catch (err) {
      setError('Đã có lỗi xảy ra khi tạo câu hỏi. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [subject, grade, topic, numQuestionsByDifficulty, totalQuestions, savedSets]);

  const canGenerate = !isLoading && topic.trim().length > 0 && totalQuestions > 0 && totalQuestions <= 20;
  
  const optionLabels = ['A', 'B', 'C', 'D'];

  const generateFormText = () => {
    const formContent = questions.map(q => 
        `${q.question}\n${q.options.join('\n')}`
    ).join('\n\n');

    const answerContent = questions.map((q, index) => 
        `Câu ${index + 1}: ${optionLabels[q.correctAnswerIndex]}\nGiải thích: ${q.explanation}`
    ).join('\n---\n');
    
    return { formContent, answerContent };
  };

  const handleCopyForForm = () => {
      setFormModalOpen(true);
  };

  const escapeCsvCell = (cell: string | number): string => {
    const cellStr = String(cell);
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        const escapedStr = cellStr.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return cellStr;
  };
  
  const handleDownloadExcel = () => {
      if (questions.length === 0) return;
  
      const headers = ['STT', 'Mức độ', 'Câu hỏi', 'Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D', 'Đáp án đúng', 'Giải thích'];
      
      const rows = questions.map((q, index) => {
          const rowData = [
              index + 1,
              q.difficulty,
              q.question,
              q.options[0] || '',
              q.options[1] || '',
              q.options[2] || '',
              q.options[3] || '',
              optionLabels[q.correctAnswerIndex],
              q.explanation
          ];
          return rowData.map(escapeCsvCell).join(',');
      });
  
      const csvContent = [headers.join(','), ...rows].join('\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `cau_hoi_${subject}_lop${grade}_${safeTopic}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleReviewSet = (setId: string) => {
    const set = savedSets.find(s => s.id === setId);
    if (set) {
      setSubject(set.subject);
      setGrade(set.grade);
      setTopic(set.topic);
      setQuestions(set.questions);
      setError(null);
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-blue-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="w-full h-48 md:h-56 mb-8 rounded-2xl overflow-hidden shadow-lg group transform hover:scale-105 transition-transform duration-300">
              <img 
                  src={SUBJECT_IMAGES[subject]} 
                  alt={`Hình ảnh minh họa cho môn ${subject}`} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
              />
          </div>

          <header className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
              <i className="fa-solid fa-robot mr-3 text-blue-600"></i>
              Kho học liệu AI
            </h1>
            <p className="text-lg text-slate-600 mt-2">Tạo câu hỏi trắc nghiệm theo mức độ</p>
          </header>

          <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  <i className="fa-solid fa-book mr-2"></i>Môn học
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-2">
                  <i className="fa-solid fa-graduation-cap mr-2"></i>Lớp
                </label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                  <i className="fa-solid fa-lightbulb mr-2"></i>Chủ đề
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Quang hợp ở thực vật"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <fieldset className="md:col-span-2 border border-slate-300 p-4 rounded-lg">
                  <legend className="text-sm font-medium text-slate-700 px-2">
                      <i className="fa-solid fa-layer-group mr-2"></i>Số lượng câu hỏi theo mức độ (Tổng ≤ 20)
                  </legend>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                      {DIFFICULTY_LEVELS.map(level => (
                           <div key={level}>
                              <label htmlFor={`num-${level}`} className="block text-sm font-medium text-slate-600 mb-1">{level}</label>
                              <input
                                  id={`num-${level}`}
                                  type="number"
                                  value={numQuestionsByDifficulty[level]}
                                  onChange={(e) => handleDifficultyChange(level, e.target.value)}
                                  min="0"
                                  max="10"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                              />
                          </div>
                      ))}
                  </div>
              </fieldset>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleGenerateQuestions}
                disabled={!canGenerate}
                className={`flex items-center justify-center w-full sm:w-auto px-8 py-3 text-base font-semibold text-white rounded-lg shadow-md transition-all duration-300 ease-in-out
                  ${canGenerate
                    ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                    : 'bg-blue-300 cursor-not-allowed'
                  }`}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span className="ml-2">Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                    Tạo {totalQuestions > 0 ? `${totalQuestions} câu hỏi` : 'câu hỏi'}
                  </>
                )}
              </button>
            </div>
          </main>

          <div className="mt-10" ref={resultsRef}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center" role="alert">
                <strong className="font-bold">Lỗi!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}

            {isLoading && (
               <div className="text-center text-slate-600">
                  <p>AI đang tư duy để tạo ra những câu hỏi chất lượng nhất. Vui lòng chờ trong giây lát...</p>
              </div>
            )}

            {!isLoading && questions.length === 0 && !error && (
              <div className="text-center text-slate-500 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <i className="fa-solid fa-file-lines text-5xl text-slate-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-700">Chưa có câu hỏi nào</h3>
                  <p className="mt-2">Nhập các thông tin ở trên và nhấn "Tạo câu hỏi" để bắt đầu.</p>
              </div>
            )}

            {questions.length > 0 && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 mb-4">
                      <h2 className="text-2xl font-bold text-slate-800 text-left">Kết quả ({questions.length} câu)</h2>
                      <div className="flex items-center space-x-3">
                          <button
                              onClick={handleCopyForForm}
                              className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 ease-in-out transform hover:scale-105"
                          >
                              <i className="fa-solid fa-paste mr-2"></i>
                              Sao chép sang Form
                          </button>
                          <button
                              onClick={handleDownloadExcel}
                              className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105"
                          >
                              <i className="fa-solid fa-file-excel mr-2"></i>
                              Tải về Excel
                          </button>
                      </div>
                  </div>
                  {questions.map((q, index) => (
                      <QuestionCard key={index} question={q} index={index} />
                  ))}
              </div>
            )}
          </div>
          
          {savedSets.length > 0 && (
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
                    <i className="fa-solid fa-box-archive mr-3 text-blue-600"></i>
                    Kho học liệu đã tạo
                </h2>
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                    {savedSets.map(set => (
                        <div key={set.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex-grow mb-3 sm:mb-0">
                                <p className="font-bold text-slate-800">{set.topic}</p>
                                <div className="flex flex-wrap items-center text-sm text-slate-500 mt-1 gap-x-4 gap-y-1">
                                    <span><i className="fa-solid fa-book mr-1.5"></i>{set.subject}</span>
                                    <span><i className="fa-solid fa-graduation-cap mr-1.5"></i>Lớp {set.grade}</span>
                                    <span><i className="fa-solid fa-file-circle-question mr-1.5"></i>{set.questions.length} câu</span>
                                    <span><i className="fa-solid fa-calendar-days mr-1.5"></i>{new Date(set.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleReviewSet(set.id)}
                                className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 transition-all duration-300 ease-in-out transform hover:scale-105"
                            >
                                <i className="fa-solid fa-eye mr-2"></i>
                                Xem lại
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          )}

        </div>
      </div>
      {isFormModalOpen && (
          <ExportModal
              isOpen={isFormModalOpen}
              onClose={() => setFormModalOpen(false)}
              title="Sao chép nội dung câu hỏi"
              formContent={generateFormText().formContent}
              answerContent={generateFormText().answerContent}
          />
      )}
    </>
  );
};

export default App;