import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, 
  Trash2, Edit, Save, ArrowRight, ShieldAlert, Sparkles, Clock
} from 'lucide-react';

export default function AiDocumentImportPage() {
  const [file, setFile] = useState(null);
  const [targetCategory, setTargetCategory] = useState('auto');
  const [targetHsk, setTargetHsk] = useState('1');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Preview data state
  const [previewDocId, setPreviewDocId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = () => {
    api.getImportHistory()
      .then(res => {
        if (res.success) setHistory(res.history);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Client-side check for dangerous files
    const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
    if (['.exe', '.bat', '.cmd', '.sh', '.msi'].includes(ext)) {
      setError(`Cảnh báo an toàn: File thực thi (${ext}) bị từ chối tuyệt đối! Vui lòng chỉ chọn Word (.docx), Excel (.xlsx), PDF, TXT hoặc CSV.`);
      setFile(null);
      return;
    }

    setError('');
    setFile(selected);
  };

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setProgress(20);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_category', targetCategory);

      setProgress(50);
      const res = await api.uploadDocument(formData);
      setProgress(90);

      if (res.success) {
        setPreviewDocId(res.document_id);
        setPreviewData(res.analysis);
        setSuccessMsg(res.message);
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Lỗi trong quá trình xử lý tài liệu');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewDocId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.confirmImport(previewDocId, {
        target_hsk_level: parseInt(targetHsk, 10),
        override_duplicates: false
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setPreviewData(null);
        setPreviewDocId(null);
        setFile(null);
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Lỗi xác nhận nhập dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVocabRow = (index, field, value) => {
    if (!previewData || !previewData.vocabulary) return;
    const updatedVocab = [...previewData.vocabulary];
    updatedVocab[index] = { ...updatedVocab[index], [field]: value };
    setPreviewData({ ...previewData, vocabulary: updatedVocab });
  };

  const handleRemoveVocabRow = (index) => {
    if (!previewData || !previewData.vocabulary) return;
    const updatedVocab = previewData.vocabulary.filter((_, i) => i !== index);
    setPreviewData({ ...previewData, vocabulary: updatedVocab });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              AI Document Import System (Nhập Tài Liệu Thông Minh)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              Trọng tâm hệ thống
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hỗ trợ Word (DOC, DOCX), Excel (XLS, XLSX), PDF, TXT, CSV. AI tự động bóc tách từ vựng, Pinyin, ngữ pháp và đề thi HSK.
          </p>
        </div>
      </div>

      {/* Thông báo lỗi & thành công */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone & Form */}
      {!previewData && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <form onSubmit={handleUploadAndAnalyze} className="space-y-6">
            {/* Vùng kéo thả file */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
              <input
                type="file"
                id="doc-upload"
                onChange={handleFileChange}
                accept=".docx,.doc,.xlsx,.xls,.pdf,.txt,.csv"
                className="hidden"
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Kéo thả file vào đây hoặc bấm để chọn tài liệu từ máy tính'}
                  </div>
                  <p className="text-xs text-slate-400">
                    Định dạng hỗ trợ: Word (.docx, .doc), Excel (.xlsx, .xls), PDF, TXT, CSV (Tối đa 25MB)
                  </p>
                </div>
                {file && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </label>
            </div>

            {/* Cấu hình phân loại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Loại nội dung mục tiêu
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="auto">AI Tự Động Phân Loại (Đề xuất)</option>
                  <option value="vocabulary">Từ Vựng Tiếng Trung & Pinyin</option>
                  <option value="grammar">Điểm Ngữ Pháp & Công Thức</option>
                  <option value="questions">Câu Hỏi Trắc Nghiệm / Đề Thi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Cấp độ HSK mục tiêu
                </label>
                <select
                  value={targetHsk}
                  onChange={(e) => setTargetHsk(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="1">HSK 1 (Nhập môn - 150 từ)</option>
                  <option value="2">HSK 2 (Sơ cấp - 300 từ)</option>
                  <option value="3">HSK 3 (Trung cấp 1 - 600 từ)</option>
                  <option value="4">HSK 4 (Trung cấp 2 - 1200 từ)</option>
                  <option value="5">HSK 5 (Cao cấp 1 - 2500 từ)</option>
                  <option value="6">HSK 6 (Cao cấp 2 - 5000+ từ)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-600 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI Đang Phân Tích & Bóc Tách Dữ Liệu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Tải Lên & Xử Lý Bằng AI Ngay</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* BẢNG XEM TRƯỚC VÀ CHỈNH SỬA DỮ LIỆU (PREVIEW & EDIT) */}
      {previewData && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  Bản Xem Trước Dữ Liệu Bóc Tách Bằng AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Sẵn sàng duyệt
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tìm thấy: {previewData.summary?.totalVocabularyFound || 0} từ vựng, {previewData.summary?.totalQuestionsFound || 0} câu hỏi trắc nghiệm. Admin có thể sửa trực tiếp từng ô trước khi nhập vào Database.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-bold shadow-md hover:from-teal-600 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận & Lưu Vào Database</span>
              </button>
            </div>
          </div>

          {/* Bảng Từ vựng trích xuất */}
          {previewData.vocabulary && previewData.vocabulary.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Danh sách từ vựng trích xuất ({previewData.vocabulary.length} từ)</span>
                <span className="text-xs text-slate-400 font-normal">Nhấp đúp vào ô để sửa dữ liệu</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-3">Hán Tự</th>
                      <th className="p-3">Pinyin</th>
                      <th className="p-3">Nghĩa Tiếng Việt</th>
                      <th className="p-3">HSK</th>
                      <th className="p-3">Ví Dụ Tiếng Trung</th>
                      <th className="p-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewData.vocabulary.map((vocab, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-chinese font-bold text-base text-slate-800 dark:text-slate-100">
                          <input
                            type="text"
                            value={vocab.hanzi}
                            onChange={(e) => handleUpdateVocabRow(index, 'hanzi', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 px-1 py-0.5 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-teal-600 dark:text-teal-400 font-medium">
                          <input
                            type="text"
                            value={vocab.pinyin}
                            onChange={(e) => handleUpdateVocabRow(index, 'pinyin', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 px-1 py-0.5 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-slate-700 dark:text-slate-300">
                          <input
                            type="text"
                            value={vocab.vietnamese_meaning}
                            onChange={(e) => handleUpdateVocabRow(index, 'vietnamese_meaning', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 px-1 py-0.5 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                            HSK {vocab.hsk_level || targetHsk}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500">
                          <input
                            type="text"
                            value={vocab.example_cn || ''}
                            onChange={(e) => handleUpdateVocabRow(index, 'example_cn', e.target.value)}
                            placeholder="Nhập câu ví dụ..."
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 px-1 py-0.5 focus:outline-none font-chinese"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVocabRow(index)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bảng câu hỏi trắc nghiệm nếu có */}
          {previewData.questions && previewData.questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Danh sách câu hỏi trắc nghiệm trích xuất ({previewData.questions.length} câu)
              </h4>
              <div className="space-y-2">
                {previewData.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Câu {idx + 1}: {q.prompt}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                          <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lịch sử tài liệu đã nhập */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          <span>Lịch Sử Nhập Tài Liệu Bằng AI (Import History)</span>
        </h3>

        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              Chưa có tài liệu nào được tải lên.
            </div>
          ) : (
            history.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {doc.original_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kích thước: {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'imported'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {doc.status === 'imported' ? 'Đã Nhập DB' : 'Chờ Duyệt'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
