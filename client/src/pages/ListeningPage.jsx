import React, { useState, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import {
  Headphones, Play, Pause, RotateCcw, Volume2, 
  CheckCircle2, AlertCircle, FileText, Eye, EyeOff
} from 'lucide-react';

export default function ListeningPage() {
  const [materials, setMaterials] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [currentId, setCurrentId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    api.getListening(`?hsk=${selectedHsk}`)
      .then(res => {
        if (res.success && res.data.length > 0) {
          setMaterials(res.data);
          setCurrentId(res.data[0].id);
        } else {
          setMaterials([]);
          setCurrentId(null);
          setDetail(null);
        }
      });
  }, [selectedHsk]);

  useEffect(() => {
    if (currentId) {
      api.getListeningDetail(currentId).then(res => {
        if (res.success) {
          setDetail(res.data);
          setUserAnswers({});
          setIsSubmitted(false);
          setShowTranscript(false);
        }
      });
    }
  }, [currentId]);

  const handlePlayAudio = () => {
    if (!detail) return;
    setIsPlaying(true);
    speakChinese(detail.dialog_script);
    setTimeout(() => {
      setIsPlaying(false);
    }, 8000);
  };

  const handleSelectOption = (qId, option) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowTranscript(true);
    // Ghi nhận tiến độ
    api.recordProgress({ skill: 'listening', count: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Luyện Nghe Tiếng Trung HSK (听力训练)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Mô phỏng bài thi nghe HSK chuẩn: nghe hội thoại, chọn đáp án và đối chiếu Transcript song ngữ
          </p>
        </div>

        {/* HSK Level filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedHsk(String(lvl))}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                selectedHsk === String(lvl)
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách bài nghe */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
            Danh Sách Bài Luyện Nghe ({materials.length})
          </h3>
          <div className="space-y-2">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => setCurrentId(m.id)}
                className={`w-full p-3.5 rounded-2xl text-left text-xs font-semibold transition-all flex items-center justify-between ${
                  currentId === m.id
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-cyan-500" />
                  <span>{m.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                  HSK {m.hsk_level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Khu vực phòng nghe và câu hỏi */}
        <div className="lg:col-span-2 space-y-6">
          {detail ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Player Audio */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20">
                    HSK {detail.hsk_level} • Audio Bài Nghe
                  </span>
                  <h3 className="text-lg font-bold">{detail.title}</h3>
                  <p className="text-xs text-cyan-100">Bấm nút để nghe đoạn hội thoại phát âm chuẩn</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayAudio}
                    className="w-12 h-12 rounded-full bg-white text-cyan-700 flex items-center justify-center hover:scale-105 shadow-md transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-cyan-700" /> : <Play className="w-5 h-5 fill-cyan-700 ml-0.5" />}
                  </button>
                  <button
                    onClick={handlePlayAudio}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Nghe lại"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Câu hỏi trắc nghiệm */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Câu hỏi nghe hiểu:
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
                            btnStyle = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 font-bold';
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
                              {isCorrect ? 'Đúng!' : `Chưa chính xác. Đáp án: ${q.answer}`}
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

              {/* Nút nộp bài & Bật Transcript */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-2"
                >
                  {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showTranscript ? 'Ẩn Transcript' : 'Xem Transcript & Bản dịch'}</span>
                </button>

                {!isSubmitted && (
                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-md"
                  >
                    Kiểm Tra Kết Quả
                  </button>
                )}
              </div>

              {/* Hộp Transcript song ngữ */}
              {showTranscript && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-cyan-200 dark:border-cyan-900/40 space-y-3 animate-fadeIn text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <span>Văn Bản Ghi Âm (Transcript) & Dịch Nghĩa</span>
                  </div>

                  <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="font-chinese text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                      {detail.dialog_script}
                    </div>
                    {detail.pinyin_script && (
                      <div className="text-teal-600 dark:text-teal-400 whitespace-pre-line font-medium leading-relaxed">
                        {detail.pinyin_script}
                      </div>
                    )}
                    <div className="text-slate-500 whitespace-pre-line leading-relaxed border-t pt-2">
                      {detail.vietnamese_translation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Vui lòng chọn bài nghe từ danh sách bên trái.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
