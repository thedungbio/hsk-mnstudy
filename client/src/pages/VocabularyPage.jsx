import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, speakChinese } from '../services/api';
import {
  Layers, Volume2, Star, Search, Filter, 
  ChevronLeft, ChevronRight, RotateCw, CheckCircle2, Bookmark,
  Edit2, Trash2, Plus, X, Save, AlertCircle, Sparkles
} from 'lucide-react';

export default function VocabularyPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'flashcard'
  const [loading, setLoading] = useState(true);
  const [onlyStarred, setOnlyStarred] = useState(false);

  // Flashcard states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quick edit & Add modal states
  const [editingWord, setEditingWord] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    hanzi: '',
    pinyin: '',
    vietnamese_meaning: '',
    hsk_level: 1,
    category: 'Chung',
    example_sentence: '',
    example_pinyin: '',
    example_vi: ''
  });
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchVocab = () => {
    setLoading(true);
    if (onlyStarred) {
      api.getStarredVocab()
        .then(res => {
          if (res.success) setVocabList(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      const params = `?hsk=${selectedHsk}&search=${encodeURIComponent(search)}&limit=100`;
      api.getVocabulary(params)
        .then(res => {
          if (res.success) setVocabList(res.data);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchVocab();
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedHsk, search, onlyStarred]);

  const handleToggleStar = async (id) => {
    try {
      const res = await api.toggleStarVocab(id);
      if (res.success) {
        setVocabList(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, is_starred: res.is_starred ? 1 : 0 };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePronounce = (text, e) => {
    e?.stopPropagation();
    speakChinese(text);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % vocabList.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + vocabList.length) % vocabList.length);
  };

  // --- QUẢN LÝ / SỬA NHANH & XÓA TỪ VỰNG ---
  const handleOpenEdit = (item, e) => {
    e?.stopPropagation();
    setEditingWord(item);
    setModalForm({
      hanzi: item.hanzi || '',
      pinyin: item.pinyin || '',
      vietnamese_meaning: item.vietnamese_meaning || '',
      hsk_level: item.hsk_level || 1,
      category: item.category || 'Chung',
      example_sentence: item.example_cn || item.example_sentence || '',
      example_pinyin: item.example_pinyin || '',
      example_vi: item.example_vi || ''
    });
  };

  const handleOpenAdd = () => {
    setEditingWord(null);
    setModalForm({
      hanzi: '',
      pinyin: '',
      vietnamese_meaning: '',
      hsk_level: parseInt(selectedHsk, 10) || 1,
      category: 'Chung',
      example_sentence: '',
      example_pinyin: '',
      example_vi: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.hanzi.trim() || !modalForm.vietnamese_meaning.trim()) {
      alert('Vui lòng nhập chữ Hán và nghĩa tiếng Việt');
      return;
    }

    setSaving(true);
    try {
      if (editingWord) {
        // Cập nhật từ vựng
        const res = await api.updateVocabulary(editingWord.id, modalForm);
        if (res.success) {
          setVocabList(prev => prev.map(w => w.id === editingWord.id ? { ...w, ...modalForm, example_cn: modalForm.example_sentence } : w));
          setFeedbackMsg('Đã cập nhật từ vựng thành công!');
          setTimeout(() => setFeedbackMsg(''), 3000);
          setEditingWord(null);
        }
      } else {
        // Thêm từ vựng mới
        const res = await api.createVocabulary(modalForm);
        if (res.success) {
          fetchVocab();
          setFeedbackMsg('Đã thêm từ vựng mới thành công!');
          setTimeout(() => setFeedbackMsg(''), 3000);
          setIsAddModalOpen(false);
        }
      }
    } catch (err) {
      alert(`Lỗi lưu dữ liệu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVocab = async (id, hanzi, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa từ vựng '${hanzi}' khỏi hệ thống không?`)) {
      return;
    }

    try {
      const res = await api.deleteVocabulary(id);
      if (res.success) {
        setVocabList(prev => prev.filter(w => w.id !== id));
        setFeedbackMsg(`Đã xóa từ '${hanzi}' thành công.`);
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err) {
      alert(`Không thể xóa từ vựng: ${err.message}`);
    }
  };

  const currentCard = vocabList[currentIndex];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Message */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Học Từ Vựng Tiếng Trung & Flashcard
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Khung từ vựng chuẩn HSK 1 - 6, có phiên âm Pinyin, âm thanh phát âm bản xứ và chỉnh sửa nhanh
          </p>
        </div>

        {/* Chuyển đổi List / Flashcard & Thêm từ mới */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút thêm từ vựng mới (Admin/Giáo viên) */}
          {(isAdmin || isTeacher) && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Từ Mới</span>
            </button>
          )}

          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Danh Sách Từ
            </button>
            <button
              onClick={() => setViewMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'flashcard' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Thẻ Flashcard 3D
            </button>
          </div>

          <button
            onClick={() => setOnlyStarred(!onlyStarred)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              onlyStarred
                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Đã lưu</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc HSK và Tìm kiếm */}
      {!onlyStarred && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* HSK Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedHsk(String(lvl))}
                className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                  selectedHsk === String(lvl)
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm Hán tự, Pinyin, nghĩa..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* NỘI DUNG CHÍNH: FLASHCARD HOẶC LIST VIEW */}
      {viewMode === 'flashcard' ? (
        // FLASHCARD 3D FLIP MODE
        vocabList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Không có từ vựng nào trong danh mục này.
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-3">
              <span>Thẻ {currentIndex + 1} / {vocabList.length} • HSK {currentCard?.hsk_level}</span>
              {(isAdmin || isTeacher) && currentCard && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenEdit(currentCard, e)}
                    className="p-1 text-blue-500 hover:text-blue-600 cursor-pointer"
                    title="Sửa từ này"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteVocab(currentCard.id, currentCard.hanzi, e)}
                    className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Xóa từ này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thẻ 3D */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 rounded-3xl cursor-pointer perspective-1000 group select-none"
            >
              <div
                className={`w-full h-full duration-500 transform-style-3d relative rounded-3xl shadow-xl transition-all ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* MẶT TRƯỚC (CHỮ HÁN & PHÁT ÂM) */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-teal-500/30 flex flex-col items-center justify-between text-center select-none">
                  <div className="w-full flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                      HSK {currentCard?.hsk_level}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(currentCard.id);
                      }}
                      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500"
                    >
                      <Star className={`w-5 h-5 ${currentCard?.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="font-chinese text-6xl font-black text-slate-800 dark:text-slate-100 tracking-wider">
                      {currentCard?.hanzi}
                    </div>
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {currentCard?.pinyin}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handlePronounce(currentCard?.hanzi, e)}
                      className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Phát Âm</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      Bấm vào thẻ để xem nghĩa
                    </span>
                  </div>
                </div>

                {/* MẶT SAU (NGHĨA TIẾNG VIỆT & VÍ DỤ) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-tr from-teal-700 via-teal-800 to-emerald-900 text-white rounded-3xl p-8 flex flex-col items-center justify-between text-center select-none shadow-2xl">
                  <div className="w-full text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                      HSK {currentCard?.hsk_level}
                    </span>
                  </div>

                  <div className="space-y-4 max-w-sm">
                    <div className="text-2xl font-bold">
                      {currentCard?.vietnamese_meaning}
                    </div>
                    {(currentCard?.example_cn || currentCard?.example_sentence) && (
                      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md space-y-1 text-left">
                        <div className="font-chinese text-sm font-semibold text-white flex items-center justify-between">
                          <span>{currentCard?.example_cn || currentCard?.example_sentence}</span>
                          <button
                            onClick={(e) => handlePronounce(currentCard?.example_cn || currentCard?.example_sentence, e)}
                            className="p-1 hover:text-teal-200"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {currentCard?.example_pinyin && (
                          <div className="text-[11px] text-teal-200">
                            {currentCard?.example_pinyin}
                          </div>
                        )}
                        <div className="text-[11px] text-white/90">
                          {currentCard?.example_vi}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-teal-100">
                    Bấm để quay lại mặt trước
                  </div>
                </div>
              </div>
            </div>

            {/* Nút Điều khiển Flashcard */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevCard}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Từ trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Lật Thẻ</span>
              </button>

              <button
                onClick={handleNextCard}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Từ tiếp theo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )
      ) : (
        // LIST VIEW MODE
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-chinese text-2xl font-black text-slate-800 dark:text-slate-100">
                    {item.hanzi}
                  </div>
                  <div className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                    {item.pinyin}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePronounce(item.hanzi)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStar(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                    title="Lưu từ yêu thích"
                  >
                    <Star className={`w-4 h-4 ${item.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {/* NÚT SỬA NHANH & XÓA (ADMIN / GIÁO VIÊN) */}
                  {(isAdmin || isTeacher) && (
                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Sửa nhanh từ vựng này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVocab(item.id, item.hanzi)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Xóa từ vựng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {item.vietnamese_meaning}
              </div>

              {(item.example_cn || item.example_sentence) && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-chinese text-slate-800 dark:text-slate-200 font-medium">
                    {item.example_cn || item.example_sentence}
                  </div>
                  {item.example_pinyin && (
                    <div className="text-[11px] text-teal-600 dark:text-teal-400">
                      {item.example_pinyin}
                    </div>
                  )}
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {item.example_vi}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-400">
                <span>Cấp độ: HSK {item.hsk_level}</span>
                <span className="capitalize">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL SỬA NHANH & THÊM TỪ VỰNG */}
      {(editingWord || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  {editingWord ? `Sửa nhanh từ: ${editingWord.hanzi}` : 'Thêm Từ Vựng Mới Vào Kho'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingWord(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Chữ Hán (Hanzi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.hanzi}
                    onChange={(e) => setModalForm({ ...modalForm, hanzi: e.target.value })}
                    placeholder="VD: 学习"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-chinese font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phiên âm (Pinyin)
                  </label>
                  <input
                    type="text"
                    value={modalForm.pinyin}
                    onChange={(e) => setModalForm({ ...modalForm, pinyin: e.target.value })}
                    placeholder="VD: xué xí"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.vietnamese_meaning}
                  onChange={(e) => setModalForm({ ...modalForm, vietnamese_meaning: e.target.value })}
                  placeholder="VD: Học tập, học hỏi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cấp độ HSK
                  </label>
                  <select
                    value={modalForm.hsk_level}
                    onChange={(e) => setModalForm({ ...modalForm, hsk_level: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                      <option key={lvl} value={lvl}>HSK {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Chủ đề (Category)
                  </label>
                  <input
                    type="text"
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                    placeholder="VD: Trường học, Đời sống"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Câu ví dụ ứng dụng (Không bắt buộc)
                </span>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Câu ví dụ tiếng Trung</label>
                  <input
                    type="text"
                    value={modalForm.example_sentence}
                    onChange={(e) => setModalForm({ ...modalForm, example_sentence: e.target.value })}
                    placeholder="VD: 我们都在努力学习汉语。"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-chinese focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dịch nghĩa câu ví dụ</label>
                  <input
                    type="text"
                    value={modalForm.example_vi}
                    onChange={(e) => setModalForm({ ...modalForm, example_vi: e.target.value })}
                    placeholder="VD: Chúng tôi đều đang chăm chỉ học tiếng Trung."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWord(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : (editingWord ? 'Lưu Thay Đổi' : 'Thêm Từ Ngay')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
