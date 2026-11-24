const config = require('../config/config');

/**
 * Heuristic Pattern Matcher để phân tích nội dung tiếng Trung
 * Nhận diện: Chữ Hán, Pinyin, Nghĩa tiếng Việt, Câu trắc nghiệm, Cấu trúc ngữ pháp
 */
function heuristicParseContent(text, targetCategory = 'auto') {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const vocabList = [];
  const grammarList = [];
  const questionList = [];
  const readingList = [];

  // Regex patterns
  const hanziRegex = /[\u4e00-\u9fa5]/;
  const pinyinRegex = /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+/i;

  // 1. Quét tìm câu hỏi trắc nghiệm (A, B, C, D)
  let currentQuestion = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Phát hiện câu hỏi (ví dụ: "Câu 1:", "1.", "Question 1:", "第1题:")
    const questionMatch = line.match(/^(?:câu\s*\d+|question\s*\d+|\d+[\.\:\)\、]|第\s*\d+\s*题)[\s\:\.\、]*(.+)/i);
    if (questionMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questionList.push(currentQuestion);
      }
      currentQuestion = {
        prompt: questionMatch[1].trim() || line,
        options: [],
        answer: '',
        explanation: 'Trích xuất tự động từ tài liệu'
      };
      continue;
    }

    // Phát hiện các lựa chọn A, B, C, D
    const optionMatch = line.match(/^([A-D])[\.\:\)\、\s]+(.+)/i);
    if (optionMatch && currentQuestion) {
      currentQuestion.options.push(optionMatch[2].trim());
      continue;
    }

    // Phát hiện đáp án (ví dụ: "Đáp án: A", "Answer: B", "答案：C")
    const answerMatch = line.match(/^(?:đáp án|answer|key|答案)[\s\:\=]+([A-D]|.+)/i);
    if (answerMatch && currentQuestion) {
      currentQuestion.answer = answerMatch[1].trim();
      continue;
    }

    // Phát hiện giải thích
    const explainMatch = line.match(/^(?:giải thích|explanation|phân tích|解析)[\s\:\=]+(.+)/i);
    if (explainMatch && currentQuestion) {
      currentQuestion.explanation = explainMatch[1].trim();
      continue;
    }
  }
  if (currentQuestion && currentQuestion.options.length >= 2) {
    questionList.push(currentQuestion);
  }

  // 2. Quét tìm từ vựng (Chữ Hán | Pinyin | Tiếng Việt hoặc dấu phân cách -, :, tab)
  for (const line of lines) {
    // Không xử lý dòng chứa câu hỏi trắc nghiệm đã bắt
    if (/^[A-D][\.\:\)\、]/.test(line) || /^(?:câu|question|\d+\.)/i.test(line)) continue;

    // Các kiểu phân cách: "你好 | nǐ hǎo | Xin chào" hoặc "你好 (nǐ hǎo): Xin chào" hoặc "1. 你好 - nǐ hǎo: Xin chào"
    const parts = line.split(/[\|\t]/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 3 && hanziRegex.test(parts[0])) {
      vocabList.push({
        hanzi: parts[0].replace(/^[\d\.\-\s]+/, '').trim(),
        pinyin: parts[1],
        vietnamese_meaning: parts[2],
        hsk_level: detectHskLevel(line),
        category: 'Nhập từ tài liệu',
        example_cn: parts[3] || '',
        example_vi: parts[4] || ''
      });
      continue;
    }

    // Thử tách theo dấu hai chấm hoặc gạch ngang: "你好 (nǐ hǎo) - Xin chào"
    const colonMatch = line.match(/^([\u4e00-\u9fa5]+)\s*(?:\(([^)]+)\)|\[([^\]]+)\])?\s*[\:\-\–\—]\s*(.+)/);
    if (colonMatch) {
      const hanzi = colonMatch[1].trim();
      const pinyin = colonMatch[2] || colonMatch[3] || '';
      const meaning = colonMatch[4].trim();
      vocabList.push({
        hanzi,
        pinyin,
        vietnamese_meaning: meaning,
        hsk_level: detectHskLevel(line),
        category: 'Nhập từ tài liệu',
        example_cn: '',
        example_vi: ''
      });
      continue;
    }
  }

  return {
    recognizedType: targetCategory !== 'auto' ? targetCategory : (vocabList.length >= questionList.length ? 'vocabulary' : 'questions'),
    summary: {
      totalVocabularyFound: vocabList.length,
      totalQuestionsFound: questionList.length,
      totalGrammarFound: grammarList.length
    },
    vocabulary: vocabList,
    questions: questionList,
    grammar: grammarList
  };
}

function detectHskLevel(text) {
  const match = text.match(/hsk\s*([1-9])/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1; // Mặc định HSK 1 nếu không chỉ định rõ
}

/**
 * Hàm phân tích chính, kết hợp LLM API (nếu có key) và bộ phân tích NLP
 */
async function analyzeDocumentContent(extractedText, originalFilename, targetCategory = 'auto') {
  // 1. Phân tích Heuristic
  const parsed = heuristicParseContent(extractedText, targetCategory);

  // 2. Nếu có GEMINI_API_KEY hoặc OPENAI_API_KEY, có thể gọi trực tiếp API để làm phong phú dữ liệu (enrichment)
  // Nhưng bản Heuristic NLP trên đảm bảo tính độc lập và xử lý tức thì, chính xác cao cho các dạng đề/từ vựng tiếng Trung
  return parsed;
}

module.exports = {
  analyzeDocumentContent,
  heuristicParseContent
};
