import React, { useState, useEffect, useRef } from 'react';
import { api, speakChinese } from '../services/api';
import {
  Edit3, RotateCcw, CheckCircle2, AlertCircle, 
  Sparkles, Bot, Trash2, Send, Award
} from 'lucide-react';

export default function WritingPage() {
  const [exercises, setExercises] = useState([]);
  const [activeTab, setActiveTab] = useState('reorder'); // 'reorder' | 'stroke' | 'essay'
  const [currentIdx, setCurrentIdx] = useState(0);

  // States cho Sắp xếp câu
  const [selectedWords, setSelectedWords] = useState([]);
  const [reorderResult, setReorderResult] = useState(null);

  // States cho Tập viết Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // States cho Viết đoạn văn
  const [essayText, setEssayText] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.getWriting(`?type=${activeTab === 'stroke' ? 'hanzi_stroke' : activeTab === 'essay' ? 'essay' : 'sentence_reorder'}`)
      .then(res => {
        if (res.success) {
          setExercises(res.data);
          setCurrentIdx(0);
          resetExercise();
        }
      });
  }, [activeTab]);

  const resetExercise = () => {
    setSelectedWords([]);
    setReorderResult(null);
    setEssayText('');
    setAiFeedback(null);
    clearCanvas();
  };

  const currentEx = exercises[currentIdx];

  // Canvas drawing logic
  useEffect(() => {
    if (activeTab === 'stroke' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0d9488'; // Teal stroke
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [activeTab, currentIdx]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Reorder words logic
  const handleWordClick = (word) => {
    if (reorderResult) return;
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleCheckReorder = () => {
    if (!currentEx) return;
    const constructedSentence = selectedWords.join('').trim();
    const target = currentEx.sample_answer.replace(/[。,\s]/g, '');
    const userClean = constructedSentence.replace(/[。,\s]/g, '');

    const isCorrect = target === userClean;
    setReorderResult({
      isCorrect,
      message: isCorrect
        ? 'Xuất sắc! Bạn đã sắp xếp đúng thứ tự câu theo ngữ pháp tiếng Trung.'
        : `Chưa đúng. Đáp án chuẩn là: "${currentEx.sample_answer}"`
    });

    if (isCorrect) {
      api.recordProgress({ skill: 'writing', count: 1 });
    }
  };

  // AI Essay Feedback logic
  const handleCheckEssayWithAI = async () => {
    if (!essayText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiFeedback(null);

    try {
      const res = await api.askTutor({
        message: `Hãy chấm điểm và sửa lỗi ngữ pháp, dùng từ cho đoạn văn tiếng Trung sau (yêu cầu khoảng 80 chữ HSK): "${essayText}". Đưa ra nhận xét tích cực và bản sửa mẫu.`,
        mode: 'chat'
      });
      if (res.success) {
        setAiFeedback(res.reply);
        api.recordProgress({ skill: 'writing', count: 2 });
      }
    } catch (err) {
      setAiFeedback(`Lỗi phân tích AI: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Luyện Viết Tiếng Trung & Hán Tự (书写训练)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Tập viết nét chữ Hán trên Canvas, sắp xếp trật tự từ tạo thành câu và viết đoạn văn AI nhận xét
          </p>
        </div>

        {/* 3 Chế độ viết */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reorder')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'reorder' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sắp Xếp Câu
          </button>
          <button
            onClick={() => setActiveTab('stroke')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'stroke' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tập Viết Nét Hán Tự
          </button>
          <button
            onClick={() => setActiveTab('essay')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'essay' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Viết Đoạn Văn (AI Chấm)
          </button>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: SẮP XẾP CÂU (SENTENCE REORDER) */}
      {activeTab === 'reorder' && currentEx && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bài {currentIdx + 1} / {exercises.length}</span>
            <span className="font-semibold text-teal-600">HSK {currentEx.hsk_level} • Dạng đề thi viết HSK</span>
          </div>

          <div className="text-center space-y-2">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {currentEx.title}
            </h3>
            <p className="text-xs text-slate-500">
              Nhấp vào từng khối từ bên dưới theo đúng thứ tự để tạo thành một câu hoàn chỉnh:
            </p>
          </div>

          {/* Vùng hiển thị câu đang ghép */}
          <div className="min-h-16 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-teal-500/40 flex flex-wrap items-center justify-center gap-2 font-chinese text-lg font-bold text-teal-800 dark:text-teal-200">
            {selectedWords.length === 0 ? (
              <span className="text-slate-400 text-xs font-sans font-normal italic">
                (Chưa chọn từ nào. Nhấp các từ bên dưới để ghép vào đây)
              </span>
            ) : (
              selectedWords.map((w, idx) => (
                <span
                  key={idx}
                  onClick={() => handleWordClick(w)}
                  className="px-3 py-1 rounded-xl bg-teal-500 text-white shadow-sm cursor-pointer hover:bg-teal-600"
                >
                  {w}
                </span>
              ))
            )}
          </div>

          {/* Danh sách các khối từ bị xáo trộn */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {(currentEx.content?.scrambled_words || []).map((w, idx) => {
              const isUsed = selectedWords.includes(w);
              return (
                <button
                  key={idx}
                  disabled={isUsed}
                  onClick={() => handleWordClick(w)}
                  className={`px-4 py-2.5 rounded-xl border font-chinese text-base font-bold transition-all ${
                    isUsed
                      ? 'opacity-30 border-slate-200 bg-slate-100 dark:bg-slate-800'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-teal-500 shadow-sm'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>

          {/* Gợi ý */}
          {currentEx.content?.hint && (
            <div className="text-[11px] text-slate-400 text-center italic">
              💡 Gợi ý: {currentEx.content.hint}
            </div>
          )}

          {/* Kết quả kiểm tra */}
          {reorderResult && (
            <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn ${
              reorderResult.isCorrect ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}>
              {reorderResult.isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <div>
                <div className="font-bold text-sm">{reorderResult.isCorrect ? 'Chính xác!' : 'Chưa đúng'}</div>
                <div className="mt-1">{reorderResult.message}</div>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setSelectedWords([]);
                setReorderResult(null);
              }}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Làm lại
            </button>

            <button
              onClick={handleCheckReorder}
              disabled={selectedWords.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
            >
              Kiểm Tra Thứ Tự Câu
            </button>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: TẬP VIẾT NÉT HÁN TỰ TRÊN CANVAS */}
      {activeTab === 'stroke' && currentEx && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-teal-600">HSK {currentEx.hsk_level} • Tập viết Hán tự</span>
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">
              {currentEx.title}
            </h3>
            <p className="text-xs text-slate-500">
              Dùng chuột hoặc màn hình cảm ứng để tập viết chữ Hán theo mẫu
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            {/* Chữ mẫu tham chiếu */}
            <div className="w-48 h-48 rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col items-center justify-center space-y-1 relative">
              <span className="text-[10px] uppercase font-bold text-slate-400 absolute top-2.5">Chữ Mẫu</span>
              <div className="font-chinese text-7xl font-black text-slate-700 dark:text-slate-200">
                {currentEx.content?.hanzi || '好'}
              </div>
              <div className="text-xs font-bold text-teal-600">
                {currentEx.content?.pinyin || 'hǎo'}
              </div>
            </div>

            {/* Khung Canvas tập viết tương tác */}
            <div className="relative">
              <span className="text-[10px] uppercase font-bold text-slate-400 absolute top-2.5 left-4 z-10">
                Bảng Tập Viết
              </span>
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-48 h-48 rounded-3xl border-2 border-teal-500 bg-white dark:bg-slate-900 shadow-inner cursor-crosshair"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa viết lại
            </button>
            <button
              onClick={() => {
                alert('Rất tốt! Bạn đã hoàn thành bài luyện viết nét chữ Hán.');
                api.recordProgress({ skill: 'writing', count: 1 });
              }}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-sm"
            >
              Hoàn Thành
            </button>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 3: VIẾT ĐOẠN VĂN & AI CHẤM ĐIỂM */}
      {activeTab === 'essay' && currentEx && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-purple-600">HSK {currentEx.hsk_level} • Viết đoạn văn tự do</span>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {currentEx.title}
            </h3>
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 font-medium">
              📝 <strong>Đề bài:</strong> {currentEx.content?.prompt}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Nội dung bài viết của bạn (Chữ Hán):
            </label>
            <textarea
              rows={5}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Nhập đoạn văn tiếng Trung của bạn tại đây..."
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-chinese focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Số ký tự đã viết: {essayText.length}</span>
              <span>Khuyến nghị: 80 - 100 chữ</span>
            </div>
          </div>

          <button
            onClick={handleCheckEssayWithAI}
            disabled={!essayText.trim() || aiLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>AI Đang Phân Tích Ngữ Pháp & Chấm Điểm...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Gửi Cho AI Chấm Điểm & Gợi Ý Sửa Lỗi</span>
              </>
            )}
          </button>

          {aiFeedback && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-purple-200 dark:border-purple-900/40 space-y-2 animate-fadeIn text-xs leading-relaxed">
              <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Nhận Xét & Đánh Giá Chi Tiết Từ AI Gia Sư:</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {aiFeedback}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
