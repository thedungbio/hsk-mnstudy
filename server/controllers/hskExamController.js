const db = require('../database/db');

// Lấy danh sách đề thi HSK
exports.getExamList = (req, res) => {
  try {
    const { hsk } = req.query;
    let query = 'SELECT id, title, hsk_level, duration_minutes, total_questions, passing_score, created_at FROM hsk_exams WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const exams = db.prepare(query).all(...params);

    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết đề thi để bắt đầu làm bài (Ẩn đáp án đúng để chống gian lận)
exports.getExamDetail = (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM hsk_exams WHERE id = ?').get(id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    const sections = JSON.parse(exam.sections);

    // Xóa đáp án đúng trong đề khi gửi cho học sinh làm bài
    const sanitizeSection = (sec) => {
      if (!sec || !sec.questions) return sec;
      const cleanQuestions = sec.questions.map(q => {
        const { answer, explanation, ...clientQuestion } = q;
        return clientQuestion;
      });
      return { ...sec, questions: cleanQuestions };
    };

    const sanitizedSections = {};
    for (const [key, section] of Object.entries(sections)) {
      sanitizedSections[key] = sanitizeSection(section);
    }

    res.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        hsk_level: exam.hsk_level,
        duration_minutes: exam.duration_minutes,
        total_questions: exam.total_questions,
        passing_score: exam.passing_score,
        sections: sanitizedSections
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nộp bài thi và Chấm điểm tự động
exports.submitExam = (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswers } = req.body; // { 'L1': 'Đúng (对)', 'R1': '朋友', ... }
    const userId = req.user.id;

    const exam = db.prepare('SELECT * FROM hsk_exams WHERE id = ?').get(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Đề thi không tồn tại' });
    }

    const sections = JSON.parse(exam.sections);
    const detailedFeedback = {};
    let correctCountListening = 0;
    let totalCountListening = 0;
    let correctCountReading = 0;
    let totalCountReading = 0;
    let correctCountWriting = 0;
    let totalCountWriting = 0;

    // Chấm phần Nghe (Listening)
    if (sections.listening && Array.isArray(sections.listening.questions)) {
      sections.listening.questions.forEach(q => {
        totalCountListening++;
        const userAns = userAnswers ? userAnswers[q.id] : null;
        const isCorrect = userAns && (userAns.trim().toLowerCase() === q.answer.trim().toLowerCase());
        if (isCorrect) correctCountListening++;

        detailedFeedback[q.id] = {
          section: 'listening',
          prompt: q.prompt,
          userAnswer: userAns || 'Chưa trả lời',
          correctAnswer: q.answer,
          isCorrect: !!isCorrect,
          explanation: q.explanation || ''
        };
      });
    }

    // Chấm phần Đọc (Reading)
    if (sections.reading && Array.isArray(sections.reading.questions)) {
      sections.reading.questions.forEach(q => {
        totalCountReading++;
        const userAns = userAnswers ? userAnswers[q.id] : null;
        const isCorrect = userAns && (userAns.trim().toLowerCase() === q.answer.trim().toLowerCase());
        if (isCorrect) correctCountReading++;

        detailedFeedback[q.id] = {
          section: 'reading',
          prompt: q.prompt,
          userAnswer: userAns || 'Chưa trả lời',
          correctAnswer: q.answer,
          isCorrect: !!isCorrect,
          explanation: q.explanation || ''
        };
      });
    }

    // Chấm phần Viết (Writing) nếu có
    if (sections.writing && Array.isArray(sections.writing.questions)) {
      sections.writing.questions.forEach(q => {
        totalCountWriting++;
        const userAns = userAnswers ? userAnswers[q.id] : null;
        const isCorrect = userAns && (userAns.trim().replace(/\s+/g, '') === q.answer.trim().replace(/\s+/g, ''));
        if (isCorrect) correctCountWriting++;

        detailedFeedback[q.id] = {
          section: 'writing',
          prompt: q.prompt,
          userAnswer: userAns || 'Chưa trả lời',
          correctAnswer: q.answer,
          isCorrect: !!isCorrect,
          explanation: q.explanation || ''
        };
      });
    }

    // Tính thang điểm HSK chuẩn
    // HSK 1 - 2: Tối đa 200 điểm (Nghe 100, Đọc 100, Đạt: >= 120)
    // HSK 3 - 6: Tối đa 300 điểm (Nghe 100, Đọc 100, Viết 100, Đạt: >= 180)
    const maxSectionScore = 100;
    const scoreListening = totalCountListening > 0 ? Math.round((correctCountListening / totalCountListening) * maxSectionScore) : 0;
    const scoreReading = totalCountReading > 0 ? Math.round((correctCountReading / totalCountReading) * maxSectionScore) : 0;
    const scoreWriting = totalCountWriting > 0 ? Math.round((correctCountWriting / totalCountWriting) * maxSectionScore) : 0;
    const totalScore = scoreListening + scoreReading + (totalCountWriting > 0 ? scoreWriting : 0);

    const isPassed = totalScore >= exam.passing_score ? 1 : 0;

    // Lưu kết quả vào Database
    const insertResult = db.prepare(`
      INSERT INTO exam_results (user_id, exam_id, score_listening, score_reading, score_writing, total_score, is_passed, answers, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const resultInfo = insertResult.run(
      userId,
      exam.id,
      scoreListening,
      scoreReading,
      scoreWriting,
      totalScore,
      isPassed,
      JSON.stringify(userAnswers || {}),
      JSON.stringify(detailedFeedback)
    );

    res.json({
      success: true,
      result_id: resultInfo.lastInsertRowid,
      summary: {
        examTitle: exam.title,
        hskLevel: exam.hsk_level,
        scoreListening,
        scoreReading,
        scoreWriting,
        totalScore,
        passingScore: exam.passing_score,
        isPassed: !!isPassed,
        correctCountListening,
        totalCountListening,
        correctCountReading,
        totalCountReading,
        correctCountWriting,
        totalCountWriting
      },
      detailedFeedback
    });
  } catch (error) {
    console.error('Lỗi nộp bài thi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy lịch sử kết quả thi của học sinh
exports.getUserExamHistory = (req, res) => {
  try {
    const userId = req.user.id;
    const history = db.prepare(`
      SELECT r.id, r.exam_id, r.score_listening, r.score_reading, r.score_writing, r.total_score, r.is_passed, r.created_at,
             e.title as exam_title, e.hsk_level, e.passing_score
      FROM exam_results r
      JOIN hsk_exams e ON r.exam_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
