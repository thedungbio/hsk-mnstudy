import React, { useState, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import {
  Award, Clock, CheckCircle2, AlertCircle, Play, 
  RotateCcw, Volume2, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function HskExamPage() {
  const [examList, setExamList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [activeExam, setActiveExam] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  // Load danh sách đề thi
  useEffect(() => {
    api.getExams(`?hsk=${selectedHsk}`).then(res => {
      if (res.success) setExamList(res.exams);
    });
  }, [selectedHsk]);

  // Bộ đếm thời gian thi (Timer)
  useEffect(() => {
    if (!activeExam || examResult) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, timeLeft, examResult]);

  const handleStartExam = async (examId) => {
    try {
      const res = await api.getExamDetail(examId);
      if (res.success) {
        setActiveExam(res.exam);
        setTimeLeft(res.exam.duration_minutes * 60);
        setUserAnswers({});
        setExamResult(null);
      }
    } catch (err) {
      alert(`Không thể tải đề thi: ${err.message}`);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    if (examResult) return;
    const updated = { ...userAnswers, [questionId]: answer };
    setUserAnswers(updated);
    // Tự động lưu tiến độ vào localStorage phòng trường hợp mất điện
    localStorage.setItem(`hsk_exam_${activeExam.id}_progress`, JSON.stringify(updated));
  };

  const handleAutoSubmit = () => {
    alert('Hết giờ làm bài! Hệ thống tự động thu bài và chấm điểm.');
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (!activeExam || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await api.submitExam(activeExam.id, { userAnswers });
      if (res.success) {
        setExamResult(res);
        localStorage.removeItem(`hsk_exam_${activeExam.id}_progress`);
      }
    } catch (err) {
      alert(`Lỗi nộp bài: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!activeExam && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Phòng Thi Thử HSK Thực Chiến (HSK 模拟考场)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Đề thi chuẩn hóa theo khung HSK quốc tế, có đếm giờ, lưu tiến độ, tự động chấm điểm và giải thích chi tiết
            </p>
          </div>

          {/* Chọn cấp độ HSK */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedHsk(String(lvl))}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  selectedHsk === String(lvl)
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH ĐỀ THI KHI CHƯA VÀO PHÒNG THI */}
      {!activeExam && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {examList.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Chưa có đề thi nào cho cấp độ HSK này.
            </div>
          ) : (
            examList.map((exam) => (
              <div
                key={exam.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                      HSK {exam.hsk_level} Chuẩn
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} phút
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
                    {exam.title}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>• Tổng số câu: <strong>{exam.total_questions} câu</strong></div>
                    <div>• Điểm chuẩn đạt: <strong>{exam.passing_score} điểm</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartExam(exam.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu Làm Bài Thi</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* GIAO DIỆN PHÒNG THI THỰC CHIẾN (ACTIVE EXAM) */}
      {activeExam && (
        <div className="space-y-6">
          {/* Thanh trạng thái phòng thi cố định */}
          <div className="sticky top-14 sm:top-16 z-20 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-semibold truncate">Đang thi: {activeExam.title}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                HSK {activeExam.hsk_level} • Đã trả lời: {Object.keys(userAnswers).length} / {activeExam.total_questions} câu
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4">
              {/* Đồng hồ đếm ngược */}
              <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-mono text-sm sm:text-base font-bold shadow-sm ${
                timeLeft < 300
                  ? 'bg-rose-50 text-rose-600 border border-rose-300 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {!examResult && (
                <button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-md hover:from-teal-600 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang chấm...' : 'Nộp Bài Thi'}
                </button>
              )}
            </div>
          </div>

          {/* KẾT QUẢ THI SAU KHI NỘP BÀI */}
          {examResult && (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-500/50 shadow-xl space-y-6 text-center animate-fadeIn">
              <div className="space-y-2">
                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  examResult.summary.isPassed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {examResult.summary.isPassed ? 'CHÚC MỪNG BẠN ĐÃ THI ĐẠT (恭喜通过)' : 'CHƯA ĐẠT CHUẨN ĐIỂM (请继续努力)'}
                </span>

                <div className="text-5xl font-black text-slate-800 dark:text-slate-100 pt-2">
                  {examResult.summary.totalScore} <span className="text-lg text-slate-400 font-normal">/ {activeExam.passing_score > 150 ? '300' : '200'} điểm</span>
                </div>
                <div className="text-xs text-slate-500">
                  Điểm chuẩn yêu cầu: {examResult.summary.passingScore} điểm
                </div>
              </div>

              {/* Thống kê điểm từng phần */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto text-xs">
                <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200">
                  <div className="text-cyan-700 dark:text-cyan-300 font-bold">Nghe Hiểu (听力)</div>
                  <div className="text-xl font-black mt-1">{examResult.summary.scoreListening} đ</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{examResult.summary.correctCountListening}/{examResult.summary.totalCountListening} câu</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200">
                  <div className="text-indigo-700 dark:text-indigo-300 font-bold">Đọc Hiểu (阅读)</div>
                  <div className="text-xl font-black mt-1">{examResult.summary.scoreReading} đ</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{examResult.summary.correctCountReading}/{examResult.summary.totalCountReading} câu</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200">
                  <div className="text-purple-700 dark:text-purple-300 font-bold">Viết (书写)</div>
                  <div className="text-xl font-black mt-1">{examResult.summary.scoreWriting} đ</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{examResult.summary.correctCountWriting}/{examResult.summary.totalCountWriting} câu</div>
                </div>
              </div>

              <button
                onClick={() => setActiveExam(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Quay lại danh sách đề thi
              </button>
            </div>
          )}

          {/* NỘI DUNG CÁC PHẦN THI (NGHE, ĐỌC, VIẾT) */}
          <div className="space-y-6">
            {/* 1. Phần Nghe */}
            {activeExam.sections.listening && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {activeExam.sections.listening.title}
                  </h3>
                  <span className="text-xs text-slate-400">Thời gian phần thi: {activeExam.sections.listening.duration_minutes} phút</span>
                </div>

                <div className="space-y-4">
                  {(activeExam.sections.listening.questions || []).map((q, idx) => {
                    const userAns = userAnswers[q.id];
                    const feedback = examResult?.detailedFeedback?.[q.id];

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-600">Câu {idx + 1} ({q.id})</span>
                          {q.audio_text && (
                            <button
                              onClick={() => speakChinese(q.audio_text)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 text-[11px] font-semibold flex items-center gap-1 hover:bg-cyan-200"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Nghe audio
                            </button>
                          )}
                        </div>

                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                          {q.prompt}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = userAns === opt;
                            let style = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
                            if (feedback) {
                              if (opt === feedback.correctAnswer) style = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                              else if (isChosen) style = 'bg-rose-50 border-rose-400 text-rose-800';
                            } else if (isChosen) {
                              style = 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 font-bold';
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`p-3 rounded-xl border text-left font-medium transition-all ${style}`}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {feedback && (
                          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                            feedback.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                            <div>
                              <div className="font-bold">{feedback.isCorrect ? 'Chính xác!' : `Đáp án đúng: ${feedback.correctAnswer}`}</div>
                              <div className="mt-0.5 text-slate-600">{feedback.explanation}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Phần Đọc */}
            {activeExam.sections.reading && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {activeExam.sections.reading.title}
                  </h3>
                  <span className="text-xs text-slate-400">Thời gian phần thi: {activeExam.sections.reading.duration_minutes} phút</span>
                </div>

                <div className="space-y-4">
                  {(activeExam.sections.reading.questions || []).map((q, idx) => {
                    const userAns = userAnswers[q.id];
                    const feedback = examResult?.detailedFeedback?.[q.id];

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                        <span className="text-xs font-bold text-indigo-600">Câu {idx + 1} ({q.id})</span>
                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                          {q.prompt}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = userAns === opt;
                            let style = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
                            if (feedback) {
                              if (opt === feedback.correctAnswer) style = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                              else if (isChosen) style = 'bg-rose-50 border-rose-400 text-rose-800';
                            } else if (isChosen) {
                              style = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 font-bold';
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`p-3 rounded-xl border text-left font-medium transition-all ${style}`}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {feedback && (
                          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                            feedback.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                            <div>
                              <div className="font-bold">{feedback.isCorrect ? 'Chính xác!' : `Đáp án đúng: ${feedback.correctAnswer}`}</div>
                              <div className="mt-0.5 text-slate-600">{feedback.explanation}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
