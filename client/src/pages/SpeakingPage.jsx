import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, speakChinese } from '../services/api';
import {
  Mic, MicOff, Volume2, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, Award, Edit2, Trash2, Plus, X, Save
} from 'lucide-react';

export default function SpeakingPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Quick edit & Add modal states
  const [editingExercise, setEditingExercise] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    prompt_cn: '',
    pinyin: '',
    vietnamese_meaning: '',
    difficulty: 'Dễ',
    hsk_level: 1
  });
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Khởi tạo Web Speech Recognition nếu trình duyệt hỗ trợ
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN'; // Nhận diện tiếng Trung phổ thông
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        evaluateSpeech(text);
      };

      recognition.onerror = (event) => {
        console.error('Lỗi nhận diện giọng nói:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const loadExercises = () => {
    api.getSpeaking(`?hsk=${selectedHsk}`).then(res => {
      if (res.success) {
        setExercises(res.data);
        if (currentIdx >= res.data.length) {
          setCurrentIdx(Math.max(0, res.data.length - 1));
        }
        resetState();
      }
    });
  };

  useEffect(() => {
    loadExercises();
    setCurrentIdx(0);
  }, [selectedHsk]);

  const resetState = () => {
    setTranscript('');
    setScore(null);
    setFeedback('');
    setIsRecording(false);
  };

  const currentExercise = exercises[currentIdx];

  const handleStartRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API tiếng Trung. Khuyên dùng Google Chrome hoặc Microsoft Edge.');
      return;
    }
    resetState();
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Thuật toán so khớp chuỗi chữ Hán và tính điểm phát âm
  const evaluateSpeech = (userSpeech) => {
    if (!currentExercise) return;
    const target = (currentExercise.prompt_cn || currentExercise.prompt || '').replace(/[^\u4e00-\u9fa5]/g, '');
    const cleanUser = userSpeech.replace(/[^\u4e00-\u9fa5]/g, '');

    // Đếm số ký tự trùng khớp
    let matches = 0;
    for (let char of cleanUser) {
      if (target.includes(char)) matches++;
    }

    const calculatedScore = Math.min(100, Math.round((matches / Math.max(target.length, 1)) * 100));
    setScore(calculatedScore);

    if (calculatedScore >= 85) {
      setFeedback('Tuyệt vời! Phát âm chuẩn xác, thanh điệu rất tự nhiên và tròn vành rõ chữ.');
      api.recordProgress({ skill: 'speaking', count: 1 });
    } else if (calculatedScore >= 60) {
      setFeedback('Khá tốt! Bạn đã phát âm đúng phần lớn các từ, cần chú ý thêm thanh 1 và thanh 4 để thanh điệu sắc nét hơn.');
    } else {
      setFeedback('Cần luyện tập thêm! Hãy nghe lại phát âm mẫu của hệ thống và nhấn giọng dứt khoát hơn nhé.');
    }
  };

  // --- QUẢN LÝ / SỬA NHANH & XÓA BÀI LUYỆN NÓI ---
  const handleOpenEdit = (item) => {
    setEditingExercise(item);
    setModalForm({
      title: item.title || '',
      prompt_cn: item.prompt_cn || item.prompt || '',
      pinyin: item.pinyin || '',
      vietnamese_meaning: item.vietnamese_meaning || '',
      difficulty: item.difficulty || 'Dễ',
      hsk_level: item.hsk_level || parseInt(selectedHsk, 10) || 1
    });
  };

  const handleOpenAdd = () => {
    setEditingExercise(null);
    setModalForm({
      title: 'Luyện nói câu',
      prompt_cn: '',
      pinyin: '',
      vietnamese_meaning: '',
      difficulty: 'Dễ',
      hsk_level: parseInt(selectedHsk, 10) || 1
    });
    setIsAddModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.prompt_cn.trim() || !modalForm.vietnamese_meaning.trim()) {
      alert('Vui lòng nhập câu tiếng Trung và nghĩa tiếng Việt');
      return;
    }

    setSaving(true);
    try {
      if (editingExercise) {
        // Cập nhật bài luyện nói
        const res = await api.updateSpeaking(editingExercise.id, modalForm);
        if (res.success) {
          setFeedbackMsg('Đã cập nhật bài nói thành công!');
          setExercises(prev => prev.map(item => item.id === editingExercise.id ? { ...item, ...modalForm } : item));
          setEditingExercise(null);
        } else {
          alert(res.message || 'Lỗi cập nhật');
        }
      } else {
        // Thêm mới bài luyện nói
        const res = await api.createSpeaking(modalForm);
        if (res.success) {
          setFeedbackMsg('Đã thêm bài nói mới thành công!');
          setIsAddModalOpen(false);
          loadExercises();
        } else {
          alert(res.message || 'Lỗi thêm mới');
        }
      }
    } catch (err) {
      alert('Có lỗi xảy ra: ' + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const handleDeleteExercise = async (item) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài luyện nói: "${item.title || item.prompt_cn}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await api.deleteSpeaking(item.id);
      if (res.success) {
        setFeedbackMsg(`Đã xóa bài luyện nói thành công!`);
        setExercises(prev => {
          const next = prev.filter(x => x.id !== item.id);
          if (currentIdx >= next.length) {
            setCurrentIdx(Math.max(0, next.length - 1));
          }
          return next;
        });
        resetState();
      } else {
        alert(res.message || 'Không thể xóa bài nói');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa: ' + err.message);
    } finally {
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Phòng Luyện Nói & Đánh Giá Phát Âm AI (口语训练)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Sử dụng Microphone nhận diện giọng nói tiếng Trung `zh-CN`, AI chấm điểm thanh điệu và nhận xét độ chuẩn xác
          </p>
        </div>

        {/* Actions & HSK Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isTeacher) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm Bài Nói
            </button>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedHsk(String(lvl))}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  selectedHsk === String(lvl)
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!speechSupported && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Trình duyệt hiện tại chưa kích hoạt microphone Web Speech API. Hãy mở website trên Google Chrome hoặc Edge để sử dụng đầy đủ tính năng thu âm.</span>
        </div>
      )}

      {currentExercise ? (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center relative">
          {/* Nút sửa/xóa nhanh dành cho Giáo viên / Admin */}
          {(isAdmin || isTeacher) && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(currentExercise)}
                title="Sửa nhanh bài nói"
                className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteExercise(currentExercise)}
                title="Xóa bài nói này"
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Bài {currentIdx + 1} / {exercises.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              Độ khó: {currentExercise.difficulty || 'Trung bình'}
            </span>
          </div>

          {/* Câu mẫu luyện đọc */}
          <div className="space-y-3 py-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {currentExercise.title}
            </h3>

            <div className="font-chinese text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 leading-snug">
              {currentExercise.prompt_cn || currentExercise.prompt}
            </div>

            <div className="text-base font-bold text-teal-600 dark:text-teal-400">
              {currentExercise.pinyin}
            </div>

            <div className="text-sm text-slate-500">
              {currentExercise.vietnamese_meaning}
            </div>

            <div>
              <button
                onClick={() => speakChinese(currentExercise.prompt_cn || currentExercise.prompt)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-teal-600" /> Nghe giọng đọc mẫu
              </button>
            </div>
          </div>

          {/* Khu vực Ghi âm */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40 scale-110'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {isRecording ? 'Đang lắng nghe giọng của bạn... Hãy nói câu tiếng Trung trên!' : 'Bấm vào micro và đọc to câu mẫu'}
            </div>

            {transcript && (
              <div className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-semibold">AI Nhận Diện:</span>
                <div className="font-chinese text-base font-bold text-slate-800 dark:text-slate-200">
                  {transcript}
                </div>
              </div>
            )}
          </div>

          {/* Kết quả đánh giá bằng AI */}
          {score !== null && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-center gap-2">
                <Award className="w-6 h-6 text-emerald-600" />
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                  {score} / 100 điểm
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {feedback}
              </p>
            </div>
          )}

          {/* Chuyển câu */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => {
                setCurrentIdx(prev => prev - 1);
                resetState();
              }}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 disabled:opacity-30"
            >
              Câu trước
            </button>
            <button
              disabled={currentIdx === exercises.length - 1}
              onClick={() => {
                setCurrentIdx(prev => prev + 1);
                resetState();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm disabled:opacity-30"
            >
              Câu tiếp theo
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Chưa có bài luyện nói cho cấp độ HSK này.
        </div>
      )}

      {/* MODAL THÊM / SỬA NHANH BÀI LUYỆN NÓI */}
      {(editingExercise || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {editingExercise ? 'Sửa Nhanh Bài Luyện Nói' : 'Thêm Bài Luyện Nói Mới'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingExercise(null); setIsAddModalOpen(false); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề chủ đề bài nói
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu bản thân cơ bản"
                  value={modalForm.title}
                  onChange={e => setModalForm({ ...modalForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Câu luyện nói tiếng Trung (Chữ Hán) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: 我是越南人，我正在学习汉语。"
                  value={modalForm.prompt_cn}
                  onChange={e => setModalForm({ ...modalForm, prompt_cn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-chinese text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phiên âm Pinyin
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Wǒ shì Yuènán rén, wǒ zhèngzài xuéxí Hànyǔ."
                  value={modalForm.pinyin}
                  onChange={e => setModalForm({ ...modalForm, pinyin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nghĩa tiếng Việt dịch câu *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Tôi là người Việt Nam, tôi đang học tiếng Hán."
                  value={modalForm.vietnamese_meaning}
                  onChange={e => setModalForm({ ...modalForm, vietnamese_meaning: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp độ HSK
                  </label>
                  <select
                    value={modalForm.hsk_level}
                    onChange={e => setModalForm({ ...modalForm, hsk_level: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>HSK {n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={modalForm.difficulty}
                    onChange={e => setModalForm({ ...modalForm, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditingExercise(null); setIsAddModalOpen(false); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : (editingExercise ? 'Lưu Thay Đổi' : 'Tạo Bài Nói')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
