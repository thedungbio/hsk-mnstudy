const db = require('../database/db');

// --- 1. TỪ VỰNG & FLASHCARDS ---
exports.getVocabulary = (req, res) => {
  try {
    const { hsk, search, category, page = 1, limit = 50 } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = `
      SELECT v.*,
        CASE WHEN sv.id IS NOT NULL THEN 1 ELSE 0 END AS is_starred
      FROM vocabulary v
      LEFT JOIN user_starred_vocabulary sv ON v.id = sv.vocabulary_id AND sv.user_id = ?
      WHERE 1=1
    `;
    const params = [userId];

    if (hsk) {
      query += ' AND v.hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }
    if (category) {
      query += ' AND v.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (v.hanzi LIKE ? OR v.pinyin LIKE ? OR v.vietnamese_meaning LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY v.hsk_level ASC, v.id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10));

    const items = db.prepare(query).all(...params);

    const totalCountStmt = db.prepare('SELECT count(*) as count FROM vocabulary');
    const total = totalCountStmt.get().count;

    res.json({
      success: true,
      data: items,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleStarVocabulary = (req, res) => {
  try {
    const { vocabularyId } = req.body;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM user_starred_vocabulary WHERE user_id = ? AND vocabulary_id = ?').get(userId, vocabularyId);

    if (existing) {
      db.prepare('DELETE FROM user_starred_vocabulary WHERE id = ?').run(existing.id);
      return res.json({ success: true, is_starred: false, message: 'Đã bỏ lưu từ vựng' });
    } else {
      db.prepare('INSERT INTO user_starred_vocabulary (user_id, vocabulary_id) VALUES (?, ?)').run(userId, vocabularyId);
      return res.json({ success: true, is_starred: true, message: 'Đã lưu từ vựng vào danh sách yêu thích' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStarredVocabulary = (req, res) => {
  try {
    const userId = req.user.id;
    const items = db.prepare(`
      SELECT v.*, 1 as is_starred
      FROM vocabulary v
      JOIN user_starred_vocabulary sv ON v.id = sv.vocabulary_id
      WHERE sv.user_id = ?
      ORDER BY sv.created_at DESC
    `).all(userId);

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. NGỮ PHÁP (GRAMMAR) ---
exports.getGrammar = (req, res) => {
  try {
    const { hsk, search } = req.query;
    let query = 'SELECT * FROM grammar WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }
    if (search) {
      query += ' AND (title LIKE ? OR structure LIKE ? OR explanation LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const items = db.prepare(query).all(...params);

    const formatted = items.map(item => ({
      ...item,
      practice_questions: item.practice_questions ? JSON.parse(item.practice_questions) : []
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 3. LUYỆN NGHE (LISTENING) ---
exports.getListeningList = (req, res) => {
  try {
    const { hsk } = req.query;
    let query = 'SELECT id, title, hsk_level, audio_url, created_at FROM listening_materials WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const items = db.prepare(query).all(...params);

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getListeningDetail = (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM listening_materials WHERE id = ?').get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài nghe' });
    }

    res.json({
      success: true,
      data: {
        ...item,
        questions: item.questions ? JSON.parse(item.questions) : []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. LUYỆN NÓI (SPEAKING) ---
exports.getSpeakingList = (req, res) => {
  try {
    const { hsk } = req.query;
    let query = 'SELECT * FROM speaking_exercises WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const items = db.prepare(query).all(...params);

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. LUYỆN ĐỌC (READING) ---
exports.getReadingList = (req, res) => {
  try {
    const { hsk } = req.query;
    let query = 'SELECT id, title, hsk_level, created_at FROM reading_materials WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const items = db.prepare(query).all(...params);

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReadingDetail = (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM reading_materials WHERE id = ?').get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài đọc' });
    }

    res.json({
      success: true,
      data: {
        ...item,
        questions: item.questions ? JSON.parse(item.questions) : []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 6. LUYỆN VIẾT (WRITING) ---
exports.getWritingList = (req, res) => {
  try {
    const { hsk, type } = req.query;
    let query = 'SELECT * FROM writing_exercises WHERE 1=1';
    const params = [];

    if (hsk) {
      query += ' AND hsk_level = ?';
      params.push(parseInt(hsk, 10));
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY hsk_level ASC, id ASC';
    const items = db.prepare(query).all(...params);

    const formatted = items.map(item => {
      let parsedContent = item.content;
      try {
        parsedContent = JSON.parse(item.content);
      } catch (e) {}
      return {
        ...item,
        content: parsedContent
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 7. CẬP NHẬT TIẾN ĐỘ HỌC TẬP ---
exports.recordProgress = (req, res) => {
  try {
    const userId = req.user.id;
    const { skill, count = 1 } = req.body;

    if (!skill) {
      return res.status(400).json({ success: false, message: 'Vui lòng xác định kỹ năng' });
    }

    const existing = db.prepare('SELECT * FROM learning_progress WHERE user_id = ? AND skill = ?').get(userId, skill);

    if (existing) {
      db.prepare(`
        UPDATE learning_progress
        SET completed_items_count = completed_items_count + ?,
            last_studied_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(count, existing.id);
    } else {
      db.prepare(`
        INSERT INTO learning_progress (user_id, skill, completed_items_count, streak_days)
        VALUES (?, ?, ?, 1)
      `).run(userId, skill, count);
    }

    res.json({ success: true, message: 'Cập nhật tiến độ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
