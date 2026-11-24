import React, { useState, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import {
  BookMarked, Volume2, CheckCircle2, AlertCircle, 
  HelpCircle, Eye, EyeOff
} from 'lucide-react';

export default function ReadingPage() {
  const [readingList, setReadingList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('2');
  const [currentId, setCurrentId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    api.getReading(`?hsk=${selectedHsk}`).then(res => {
      if (res.success && res.data.length > 0) {
        setReadingList(res.data);
        setCurrentId(res.data[0].id);
      } else {
        setReadingList([]);
        setCurrentId(null);
        setDetail(null);
      }
    });
  }, [selectedHsk]);

  useEffect(() => {
    if (currentId) {
      api.getReadingDetail(currentId).then(res => {
        if (res.success) {
          setDetail(res.data);
          setUserAnswers({});
          setIsSubmitted(false);
          setShowTranslation(false);
        }
      });
    }
  }, [currentId]);

  const handleSelectOption = (qId, option) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowTranslation(true);
    api.recordProgress({ skill: 'reading', count: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Luyện Đọc Hiểu Tiếng Trung HSK (阅读训练)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Nâng cao khả năng đọc hiểu văn bản chữ Hán theo từng cấp độ, trả lời câu hỏi và phân tích ngữ cảnh
          </p>
        </div>

        {/* HSK Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedHsk(String(lvl))}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                selectedHsk === String(lvl)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar danh sách bài đọc */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
            Danh Sách Bài Đọc ({readingList.length})
          </h3>
          <div className="space-y-2">
            {readingList.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentId(r.id)}
                className={`w-full p-3.5 rounded-2xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                  currentId === r.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookMarked className="w-4 h-4 text-indigo-500" />
                  <span>{r.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                  HSK {r.hsk_level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Nội dung bài đọc và câu hỏi */}
        <div className="lg:col-span-2 space-y-6">
          {detail ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Đoạn văn chữ Hán */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                    HSK {detail.hsk_level} • Đoạn văn đọc hiểu
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPinyin(!showPinyin)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                        showPinyin ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
                    </button>
                    <button
                      onClick={() => speakChinese(detail.passage_cn)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                      title="Nghe đọc toàn bài"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="font-chinese text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line tracking-wide">
                    {detail.passage_cn}
                  </div>

                  {showPinyin && detail.pinyin && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed whitespace-pre-line border-t pt-3">
                      {detail.pinyin}
                    </div>
                  )}

                  {showTranslation && detail.vietnamese_translation && (
                    <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-line border-t pt-3">
                      {detail.vietnamese_translation}
                    </div>
                  )}
                </div>
              </div>

              {/* Câu hỏi trắc nghiệm */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Câu hỏi đọc hiểu & Phân tích đáp án:
                </h4>

                {(detail.questions || []).map((q, idx) => {
                  const selected = userAnswers[q.id];
                  const isCorrect = selected === q.answer;

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {q.question}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, oIdx) => {
                          const isThis = selected === opt;
                          let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                          if (isSubmitted) {
                            if (opt === q.answer) {
                              btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                            } else if (isThis) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                            }
                          } else if (isThis) {
                            btnStyle = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 font-bold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`p-3 rounded-xl border text-left font-medium transition-all ${btnStyle}`}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isSubmitted && (
                        <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                          <div>
                            <div className="font-bold">
                              {isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án: ${q.answer}`}
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

              {/* Nút nộp bài */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  {showTranslation ? 'Ẩn bản dịch tiếng Việt' : 'Xem bản dịch tiếng Việt'}
                </button>

                {!isSubmitted && (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs shadow-md"
                  >
                    Kiểm Tra Câu Trả Lời
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Vui lòng chọn bài đọc từ danh sách.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
