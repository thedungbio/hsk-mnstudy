import React, { useState, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import {
  Layers, Volume2, Star, Search, Filter, 
  ChevronLeft, ChevronRight, RotateCw, CheckCircle2, Bookmark
} from 'lucide-react';

export default function VocabularyPage() {
  const [vocabList, setVocabList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'flashcard'
  const [loading, setLoading] = useState(true);
  const [onlyStarred, setOnlyStarred] = useState(false);

  // Flashcard states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  const currentCard = vocabList[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
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
            Khung từ vựng chuẩn HSK 1 - 6, có phiên âm Pinyin, âm thanh phát âm bản xứ và ví dụ ứng dụng
          </p>
        </div>

        {/* Chuyển đổi List / Flashcard */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Danh Sách Từ
            </button>
            <button
              onClick={() => setViewMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'flashcard' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Thẻ Flashcard 3D
            </button>
          </div>

          <button
            onClick={() => setOnlyStarred(!onlyStarred)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
                className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                  selectedHsk === String(lvl)
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-500/20'
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
            <div className="text-xs font-semibold text-slate-400">
              Thẻ {currentIndex + 1} / {vocabList.length} • HSK {currentCard?.hsk_level}
            </div>

            {/* Thẻ 3D */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 rounded-3xl cursor-pointer perspective-1000 group"
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
                    <div className="font-chinese text-6xl sm:text-7xl font-black text-slate-800 dark:text-slate-100 tracking-wider">
                      {currentCard?.hanzi}
                    </div>
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {currentCard?.pinyin}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handlePronounce(currentCard?.hanzi, e)}
                      className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center gap-2 hover:bg-teal-100"
                    >
                      <Volume2 className="w-4 h-4" /> Phát âm mẫu
                    </button>
                    <span className="text-[11px] text-slate-400 italic">Bấm để lật xem nghĩa ➔</span>
                  </div>
                </div>

                {/* MẶT SAU (NGHĨA TIẾNG VIỆT & VÍ DỤ) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-teal-600 to-blue-700 rounded-3xl p-8 text-white flex flex-col items-center justify-between text-center select-none shadow-xl">
                  <div className="w-full flex justify-between text-xs text-teal-100">
                    <span>Nghĩa & Ví dụ</span>
                    <RotateCw className="w-4 h-4 opacity-75" />
                  </div>

                  <div className="space-y-4">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                      {currentCard?.vietnamese_meaning}
                    </div>
                    {currentCard?.example_cn && (
                      <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-left space-y-1 text-xs">
                        <div className="font-chinese text-sm font-semibold text-teal-100">
                          {currentCard?.example_cn}
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
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300"
                title="Từ trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Lật Thẻ</span>
              </button>

              <button
                onClick={handleNextCard}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300"
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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStar(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    title="Lưu từ yêu thích"
                  >
                    <Star className={`w-4 h-4 ${item.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {item.vietnamese_meaning}
              </div>

              {item.example_cn && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-chinese text-slate-800 dark:text-slate-200 font-medium">
                    {item.example_cn}
                  </div>
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
    </div>
  );
}
