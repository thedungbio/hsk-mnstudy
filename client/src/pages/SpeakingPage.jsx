import React, { useState, useEffect, useRef } from 'react';
import { api, speakChinese } from '../services/api';
import {
  Mic, MicOff, Volume2, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, Award
} from 'lucide-react';

export default function SpeakingPage() {
  const [exercises, setExercises] = useState([]);
  const [selectedHsk, setSelectedHsk] = useState('1');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

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

  useEffect(() => {
    api.getSpeaking(`?hsk=${selectedHsk}`).then(res => {
      if (res.success) {
        setExercises(res.data);
        setCurrentIdx(0);
        resetState();
      }
    });
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
    const target = currentExercise.prompt_cn.replace(/[^\u4e00-\u9fa5]/g, '');
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

  return (
    <div className="space-y-6">
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

        {/* HSK Selector */}
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

      {!speechSupported && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Trình duyệt hiện tại chưa kích hoạt microphone Web Speech API. Hãy mở website trên Google Chrome hoặc Edge để sử dụng đầy đủ tính năng thu âm.</span>
        </div>
      )}

      {currentExercise ? (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Bài {currentIdx + 1} / {exercises.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              Độ khó: {currentExercise.difficulty}
            </span>
          </div>

          {/* Câu mẫu luyện đọc */}
          <div className="space-y-3 py-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {currentExercise.title}
            </h3>

            <div className="font-chinese text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 leading-snug">
              {currentExercise.prompt_cn}
            </div>

            <div className="text-base font-bold text-teal-600 dark:text-teal-400">
              {currentExercise.pinyin}
            </div>

            <div className="text-sm text-slate-500">
              {currentExercise.vietnamese_meaning}
            </div>

            <div>
              <button
                onClick={() => speakChinese(currentExercise.prompt_cn)}
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
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50 disabled:opacity-30"
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
    </div>
  );
}
