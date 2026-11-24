import React, { useState, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import { 
  BookOpen, CheckCircle, AlertCircle, Volume2, 
  ChevronDown, ChevronUp, HelpCircle 
} from 'lucide-react';

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});

  useEffect(() => {
    setLoading(true);
    api.getGrammar(`?hsk=${selectedHsk}`)
      .then(res => {
        if (res.success) {
          setGrammarList(res.data);
          if (res.data.length > 0) setExpandedId(res.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedHsk]);

  const handleSelectAnswer = (grammarId, qIdx, option) => {
    setUserAnswers(prev => ({
      ...prev,
      [`${grammarId}_${qIdx}`]: option
    }));
  };

  const toggleExplanation = (key) => {
    setShowExplanation(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Ngữ Pháp Tiếng Trung & Cấu Trúc HSK
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Tổng hợp các điểm ngữ pháp trọng điểm từ HSK 1 đến HSK 6 kèm công thức, ví dụ và bài tập thực hành
          </p>
        </div>

        {/* Cấp độ HSK */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedHsk(String(lvl))}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                selectedHsk === String(lvl)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách điểm ngữ pháp */}
      <div className="space-y-4">
        {grammarList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Chưa có bài giảng ngữ pháp cho cấp độ HSK này.
          </div>
        ) : (
          grammarList.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
              >
                {/* Header card có thể click expand */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      #{item.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <div className="text-xs font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                        {item.structure}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      HSK {item.hsk_level}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Nội dung chi tiết bài học */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/30 dark:bg-slate-850">
                    {/* Công thức & Giải thích */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Công Thức & Cấu Trúc
                      </div>
                      <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-900 dark:text-teal-200 font-mono text-sm font-semibold">
                        {item.structure}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {item.explanation}
                      </p>
                    </div>

                    {/* Ví dụ mẫu song ngữ */}
                    {item.example_cn && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Ví Dụ Minh Họa
                        </div>
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-chinese text-base font-bold text-slate-800 dark:text-slate-100">
                              {item.example_cn}
                            </div>
                            <button
                              onClick={() => speakChinese(item.example_cn)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          {item.example_pinyin && (
                            <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                              {item.example_pinyin}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">
                            {item.example_vi}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bài tập trắc nghiệm áp dụng */}
                    {item.practice_questions && item.practice_questions.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Bài Tập Trắc Nghiệm Củng Cố
                        </div>

                        {item.practice_questions.map((q, qIdx) => {
                          const key = `${item.id}_${qIdx}`;
                          const selectedOpt = userAnswers[key];
                          const isAnswered = !!selectedOpt;
                          const isCorrect = selectedOpt === q.answer;

                          return (
                            <div key={qIdx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {qIdx + 1}. {q.question}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt, oIdx) => {
                                  const isThisSelected = selectedOpt === opt;
                                  let btnClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                                  if (isAnswered) {
                                    if (opt === q.answer) {
                                      btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold';
                                    } else if (isThisSelected) {
                                      btnClass = 'bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                                    }
                                  } else {
                                    btnClass = 'hover:bg-slate-50 dark:hover:bg-slate-750';
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectAnswer(item.id, qIdx, opt)}
                                      className={`p-3 rounded-xl border text-left font-medium transition-all ${btnClass}`}
                                    >
                                      <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {isAnswered && (
                                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                                  isCorrect ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
                                }`}>
                                  {isCorrect ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                  <div>
                                    <div className="font-bold">
                                      {isCorrect ? 'Chính xác! Làm tốt lắm.' : `Chưa đúng. Đáp án chính xác là: ${q.answer}`}
                                    </div>
                                    <div className="mt-0.5 text-slate-600 dark:text-slate-400">
                                      {q.explanation}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
