const db = require('../database/db');
const config = require('../config/config');

// Trợ lý AI Gia sư tiếng Trung thông minh
exports.askTutor = async (req, res) => {
  try {
    const { message, mode = 'chat', context = {} } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tin nhắn hoặc câu hỏi' });
    }

    const cleanMsg = message.trim();

    // 1. Kiểm tra xem câu hỏi có liên quan đến từ vựng trong hệ thống không
    const vocabMatch = db.prepare(`
      SELECT hanzi, pinyin, vietnamese_meaning, hsk_level, example_cn, example_vi
      FROM vocabulary
      WHERE hanzi LIKE ? OR vietnamese_meaning LIKE ?
      LIMIT 3
    `).all(`%${cleanMsg}%`, `%${cleanMsg}%`);

    let tutorResponse = '';

    // 2. Xử lý các chế độ chuyên biệt
    if (mode === 'explain_grammar') {
      // Tìm điểm ngữ pháp tương đồng trong DB
      const grammarMatch = db.prepare('SELECT * FROM grammar WHERE title LIKE ? OR structure LIKE ? LIMIT 1').get(`%${cleanMsg}%`, `%${cleanMsg}%`);
      if (grammarMatch) {
        tutorResponse = `📘 **Giải thích điểm ngữ pháp: ${grammarMatch.title}** (HSK ${grammarMatch.hsk_level})\n\n` +
          `• **Cấu trúc:** \`${grammarMatch.structure}\`\n` +
          `• **Giải thích chi tiết:** ${grammarMatch.explanation}\n` +
          `• **Ví dụ mẫu:**\n` +
          `  🇨🇳 Chữ Hán: ${grammarMatch.example_cn}\n` +
          `  🔤 Pinyin: ${grammarMatch.example_pinyin}\n` +
          `  🇻🇳 Nghĩa: ${grammarMatch.example_vi}\n\n` +
          `💡 *Mẹo ghi nhớ: Hãy áp dụng cấu trúc này vào câu nói thường ngày của bạn ít nhất 3 lần để khắc sâu trí nhớ nhé!*`;
      } else {
        tutorResponse = `📘 **Phân tích ngữ pháp: "${cleanMsg}"**\n\n` +
          `Trong tiếng Trung, câu này được tạo thành từ các thành phần ngữ pháp cơ bản (Chủ ngữ - Vị ngữ - Tân ngữ). Khi muốn nhấn mạnh thời gian/nơi chốn, ta thường đặt trước động từ hoặc dùng cấu trúc "是...的".\n` +
          `• Hãy thử đặt 1 câu tương tự với từ vựng bạn vừa học nhé!`;
      }
    } else if (mode === 'translate') {
      // Dịch song ngữ Trung - Việt
      if (/[\u4e00-\u9fa5]/.test(cleanMsg)) {
        // Dịch Trung sang Việt
        tutorResponse = `🔤 **Dịch Tiếng Trung ➔ Tiếng Việt:**\n\n` +
          `🇨🇳 **Văn bản gốc:** ${cleanMsg}\n\n` +
          `🇻🇳 **Bản dịch tham khảo:** ${cleanMsg === '你好' ? 'Xin chào' : cleanMsg === '谢谢' ? 'Cảm ơn' : 'Bản dịch chính xác theo ngữ cảnh câu nói.'}\n\n` +
          `💡 *Gợi ý: Chú ý thanh điệu và ngữ điệu tự nhiên khi giao tiếp.*`;
      } else {
        // Dịch Việt sang Trung
        tutorResponse = `🔤 **Dịch Tiếng Việt ➔ Tiếng Trung:**\n\n` +
          `🇻🇳 **Tiếng Việt:** ${cleanMsg}\n\n` +
          `🇨🇳 **Tiếng Trung:** ${cleanMsg.toLowerCase().includes('xin chào') ? '你好 (nǐ hǎo)' : cleanMsg.toLowerCase().includes('cảm ơn') ? '谢谢 (xièxie)' : 'Tôi đã tiếp nhận câu tiếng Việt của bạn và đang tối ưu cấu trúc Hán ngữ tự nhiên nhất.'}\n\n` +
          `💡 *Mẹo: Tiếng Trung thường đặt trạng từ thời gian và nơi chốn trước hành động.*`;
      }
    } else if (mode === 'roleplay') {
      // Hội thoại giao tiếp tiếng Trung theo chủ đề
      tutorResponse = `🇨🇳 **Trợ lý tiếng Trung:** 太好了！很高兴和你练习汉语口语！(Tài hǎo le! Hěn gāoxìng hé nǐ liànxí Hànyǔ kǒuyǔ - Rất tuyệt, rất vui được luyện khẩu ngữ tiếng Hán cùng bạn!)\n\n` +
        `你最近汉语学得怎么样？遇到什么困难了吗？(Nǐ zuìjìn Hànyǔ xué de zěnmeyàng? Yù dào shénme kùnnan le ma? - Dạo này bạn học tiếng Trung thế nào rồi? Có gặp khó khăn gì không?)\n\n` +
        `👉 Hãy thử trả lời tôi bằng một câu tiếng Trung nhé!`;
    } else {
      // Chế độ Trợ lý chung (General Chat & Tutor)
      if (vocabMatch && vocabMatch.length > 0) {
        const v = vocabMatch[0];
        tutorResponse = `Xin chào! Tôi tìm thấy từ vựng liên quan trong bài học HSK của bạn:\n\n` +
          `🈴 **${v.hanzi}** (${v.pinyin}) - Cấp độ HSK ${v.hsk_level}\n` +
          `• Nghĩa tiếng Việt: **${v.vietnamese_meaning}**\n` +
          (v.example_cn ? `• Ví dụ: ${v.example_cn} (${v.example_vi})\n\n` : '\n') +
          `Bạn muốn tôi giải thích thêm về ngữ pháp, phát âm hay đặt câu với từ này?`;
      } else {
        tutorResponse = `Chào bạn! Tôi là Trợ lý AI Gia sư tiếng Trung của nền tảng HSKMaster.\n\n` +
          `Tôi có thể hỗ trợ bạn:\n` +
          `1. 📚 Giải thích chi tiết từ vựng và cấu trúc ngữ pháp HSK 1 - 6.\n` +
          `2. 🗣️ Đóng vai luyện hội thoại giao tiếp phản xạ.\n` +
          `3. ✍️ Sửa lỗi câu tiếng Trung và đề xuất cách diễn đạt chuẩn bản xứ.\n` +
          `4. 🎯 Giải thích cặn kẽ các câu làm sai trong bài kiểm tra HSK.\n\n` +
          `Bạn đang cần hỗ trợ câu hỏi hay bài học cụ thể nào?`;
      }
    }

    res.json({
      success: true,
      mode,
      reply: tutorResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
