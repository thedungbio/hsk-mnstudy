import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, speakChinese } from '../services/api';
import { 
  BookOpen, CheckCircle, AlertCircle, Volume2, 
  ChevronDown, ChevronUp, HelpCircle, Edit2, Trash2, 
  Plus, X, Save, CheckCircle2 
} from 'lucide-react';

export default function GrammarPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [grammarList, setGrammarList] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});

  // Quick Edit & Add modal states
  const [editingGrammar, setEditingGrammar] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    structure: '',
    explanation: '',
    example_sentence: '',
    example_pinyin: '',
    example_vi: '',
    hsk_level: 1
  });
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchGrammar = () => {
    setLoading(true);
    api.getGrammar(`?hsk=${selectedHsk}`)
      .then(res => {
        if (res.success) {
          setGrammarList(res.data);
          if (res.data.length > 0) setExpandedId(res.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGrammar();
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

  // --- QUẢN LÝ / SỬA NHANH & XÓA NGỮ PHÁP ---
  const handleOpenEdit = (item, e) => {
    e?.stopPropagation();
    setEditingGrammar(item);
    setModalForm({
      title: item.title || '',
      structure: item.structure || '',
      explanation: item.explanation || '',
      example_sentence: item.example_cn || item.example_sentence || '',
      example_pinyin: item.example_pinyin || '',
      example_vi: item.example_vi || '',
      hsk_level: item.hsk_level || 1
    });
  };

  const handleOpenAdd = () => {
    setEditingGrammar(null);
    setModalForm({
      title: '',
      structure: '',
      explanation: '',
      example_sentence: '',
      example_pinyin: '',
      example_vi: '',
      hsk_level: parseInt(selectedHsk, 10) || 1
    });
    setIsAddModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim() || !modalForm.structure.trim()) {
      alert('Vui lòng nhập tên điểm ngữ pháp và cấu trúc');
      return;
    }

    setSaving(true);
    try {
      if (editingGrammar) {
        // Cập nhật ngữ pháp
        const res = await api.updateGrammar(editingGrammar.id, modalForm);
        if (res.success) {
          setGrammarList(prev => prev.map(g => g.id === editingGrammar.id ? { ...g, ...modalForm, example_cn: modalForm.example_sentence } : g));
          setFeedbackMsg('Đã cập nhật điểm ngữ pháp thành công!');
          setTimeout(() => setFeedbackMsg(''), 3000);
          setEditingGrammar(null);
        }
      } else {
        // Thêm ngữ pháp mới
        const res = await api.createGrammar(modalForm);
        if (res.success) {
          fetchGrammar();
          setFeedbackMsg('Đã thêm điểm ngữ pháp mới thành công!');
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

  const handleDeleteGrammar = async (id, title, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm ngữ pháp '${title}' không?`)) {
      return;
    }

    try {
      const res = await api.deleteGrammar(id);
      if (res.success) {
        setGrammarList(prev => prev.filter(g => g.id !== id));
        setFeedbackMsg(`Đã xóa điểm ngữ pháp '${title}' thành công.`);
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err) {
      alert(`Không thể xóa ngữ pháp: ${err.message}`);
    }
  };

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
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Ngữ Pháp Tiếng Trung & Cấu Trúc HSK
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Tổng hợp các điểm ngữ pháp trọng điểm từ HSK 1 đến HSK 6 kèm công thức, ví dụ và chỉnh sửa nhanh
          </p>
        </div>

        {/* Nút Thêm mới (Admin/Giáo viên) & Cấp độ HSK */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isTeacher) && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ngữ Pháp</span>
            </button>
          )}

          {/* Cấp độ HSK */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedHsk(String(lvl))}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedHsk === String(lvl)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>
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

                    {/* Nút Sửa & Xóa (Admin / Giáo viên) */}
                    {(isAdmin || isTeacher) && (
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(item, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="Sửa điểm ngữ pháp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGrammar(item.id, item.title, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Xóa điểm ngữ pháp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 ml-1" /> : <ChevronDown className="w-5 h-5 text-slate-400 ml-1" />}
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
                    {(item.example_cn || item.example_sentence) && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Ví Dụ Minh Họa
                        </div>
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-chinese text-base font-bold text-slate-800 dark:text-slate-100">
                              {item.example_cn || item.example_sentence}
                            </div>
                            <button
                              onClick={() => speakChinese(item.example_cn || item.example_sentence)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL SỬA & THÊM NGỮ PHÁP */}
      {(editingGrammar || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  {editingGrammar ? `Sửa: ${editingGrammar.title}` : 'Thêm Điểm Ngữ Pháp Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingGrammar(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tên điểm ngữ pháp *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="VD: Câu chữ 把 (bǎ)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cấp độ HSK
                  </label>
                  <select
                    value={modalForm.hsk_level}
                    onChange={(e) => setModalForm({ ...modalForm, hsk_level: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                      <option key={lvl} value={lvl}>HSK {lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cấu trúc / Công thức *
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.structure}
                  onChange={(e) => setModalForm({ ...modalForm, structure: e.target.value })}
                  placeholder="VD: Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Giải thích chi tiết
                </label>
                <textarea
                  rows={3}
                  value={modalForm.explanation}
                  onChange={(e) => setModalForm({ ...modalForm, explanation: e.target.value })}
                  placeholder="Giải thích cách dùng, lưu ý khi sử dụng ngữ pháp này..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ví dụ minh họa
                </span>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Câu tiếng Trung</label>
                  <input
                    type="text"
                    value={modalForm.example_sentence}
                    onChange={(e) => setModalForm({ ...modalForm, example_sentence: e.target.value })}
                    placeholder="VD: 我把作业做完了。"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-chinese focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dịch nghĩa câu ví dụ</label>
                  <input
                    type="text"
                    value={modalForm.example_vi}
                    onChange={(e) => setModalForm({ ...modalForm, example_vi: e.target.value })}
                    placeholder="VD: Tôi đã làm xong bài tập rồi."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGrammar(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : (editingGrammar ? 'Lưu Thay Đổi' : 'Thêm Ngữ Pháp')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
