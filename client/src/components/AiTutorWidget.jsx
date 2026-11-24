import React, { useState, useRef, useEffect } from 'react';
import { api, speakChinese } from '../services/api';
import { 
  Bot, Send, X, Volume2, Sparkles, Languages, 
  BookOpen, MessageSquare, RefreshCw 
} from 'lucide-react';

export default function AiTutorWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '你好！(Nǐ hǎo!) Tôi là Trợ lý AI Gia sư tiếng Trung của bạn. Bạn muốn tra cứu từ vựng, giải thích ngữ pháp, dịch thuật hay cùng tôi luyện phản xạ giao tiếp hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat'); // 'chat' | 'explain_grammar' | 'translate' | 'roleplay'
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.askTutor({ message: userMsg, mode });
      if (res.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi này.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Lỗi kết nối AI: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePronounce = (text) => {
    // Trích xuất chữ Hán nếu có trong tin nhắn để phát âm
    const chineseChars = text.match(/[\u4e00-\u9fa5]+/g);
    if (chineseChars && chineseChars.length > 0) {
      speakChinese(chineseChars.join(' '));
    } else {
      speakChinese(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-2xl h-[90vh] sm:h-[650px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Trợ Lý AI Gia Sư Tiếng Trung</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-400 text-slate-900 font-bold uppercase">
                  HSK AI Core
                </span>
              </div>
              <p className="text-xs text-teal-100">
                Sẵn sàng giải thích ngữ pháp, dịch thuật và luyện giao tiếp 24/7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chế độ tương tác nhanh */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              mode === 'chat'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Hỏi đáp chung
          </button>
          <button
            onClick={() => setMode('explain_grammar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              mode === 'explain_grammar'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Giải thích ngữ pháp
          </button>
          <button
            onClick={() => setMode('translate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              mode === 'translate'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5" /> Dịch Trung - Việt
          </button>
          <button
            onClick={() => setMode('roleplay')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              mode === 'roleplay'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Luyện hội thoại
          </button>
        </div>

        {/* Danh sách tin nhắn */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.sender === 'ai' && (
                  <div className="mt-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 flex justify-end">
                    <button
                      onClick={() => handlePronounce(m.text)}
                      className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
                      title="Phát âm tiếng Trung"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Phát âm mẫu
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-500" />
              <span>AI đang phân tích và chuẩn bị câu trả lời...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Khung nhập tin nhắn */}
        <form onSubmit={handleSend} className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'explain_grammar' ? 'Nhập cấu trúc ngữ pháp (vd: 把, 是...的, 越来越)...' :
              mode === 'translate' ? 'Nhập câu tiếng Trung hoặc tiếng Việt cần dịch...' :
              mode === 'roleplay' ? 'Nhập câu trả lời bằng tiếng Trung...' :
              'Hỏi AI bất kỳ điều gì về tiếng Trung & HSK...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
