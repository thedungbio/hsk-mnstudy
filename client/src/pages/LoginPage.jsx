import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, User, LogIn, AlertCircle, Eye, EyeOff, 
  ShieldCheck, Sparkles, BookOpen, CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-900 text-slate-100">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950 pointer-events-none" />
      
      {/* Decorative Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Chinese Watermark Characters in Background */}
      <div className="absolute inset-0 flex items-center justify-between px-12 pointer-events-none select-none opacity-[0.03] text-white font-chinese text-9xl font-black hidden lg:flex">
        <span>学无止境</span>
        <span>博大精深</span>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Top Floating Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-teal-500/30 backdrop-blur-md shadow-lg shadow-teal-950/50 text-teal-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin-slow" />
            <span>Nền tảng AI Luyện thi HSK 1 - 6 Thông Minh</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800/80 p-8 sm:p-9 transition-all">
          
          {/* Brand Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl shadow-teal-500/20 font-chinese transform transition-transform hover:scale-105 duration-300">
                汉
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-400 border-2 border-slate-900 flex items-center justify-center">
                <BookOpen className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                <span>HSKMaster</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-extrabold">AI</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-chinese">
                智学中文 · 决胜HSK
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed flex-1">{error}</div>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Tài khoản hoặc Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700/80 bg-slate-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-500/60 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700/80 bg-slate-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-500/60 transition-all tracking-wider"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options: Remember me & Help */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500/40 focus:ring-offset-0 focus:ring-1"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <div className="group relative flex items-center gap-1 text-slate-400 hover:text-teal-300 cursor-pointer transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Trợ giúp?</span>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 leading-normal">
                  Tài khoản học tập và giảng dạy do quản trị viên cấp. Nếu quên mật khẩu, xin liên hệ quản trị viên trường hoặc trung tâm.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:via-teal-500 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực bảo mật...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Confidentiality Footer */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500/70" />
            <span>Hệ thống bảo mật & mã hóa thông tin xác thực</span>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="text-center mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} HSKMaster AI. Toàn bộ thông tin được bảo mật.
        </div>
      </div>
    </div>
  );
}
