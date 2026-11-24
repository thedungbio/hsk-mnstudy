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

// --- 8. QUẢN LÝ / CHỈNH SỬA NHANH & XÓA DỮ LIỆU HỌC TẬP (ADMIN / GIÁO VIÊN) ---

// Thêm từ vựng mới
exports.createVocabulary = (req, res) => {
  try {
    const { hanzi, pinyin, vietnamese_meaning, example_sentence, example_pinyin, example_vi, hsk_level = 1, category = 'Chung' } = req.body;
    if (!hanzi || !vietnamese_meaning) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ chữ Hán và nghĩa tiếng Việt' });
    }

    const result = db.prepare(`
      INSERT INTO vocabulary (hanzi, pinyin, vietnamese_meaning, example_sentence, example_pinyin, example_vi, hsk_level, category, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(hanzi.trim(), (pinyin || '').trim(), vietnamese_meaning.trim(), example_sentence || '', example_pinyin || '', example_vi || '', parseInt(hsk_level, 10), category);

    res.json({
      success: true,
      message: 'Thêm từ vựng thành công',
      data: { id: result.lastInsertRowid, hanzi, pinyin, vietnamese_meaning, hsk_level }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật / Sửa nhanh từ vựng
exports.updateVocabulary = (req, res) => {
  try {
    const { id } = req.params;
    const { hanzi, pinyin, vietnamese_meaning, example_sentence, example_pinyin, example_vi, hsk_level, category } = req.body;

    const existing = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy từ vựng' });
    }

    db.prepare(`
      UPDATE vocabulary
      SET hanzi = ?, pinyin = ?, vietnamese_meaning = ?, example_sentence = ?, example_pinyin = ?, example_vi = ?, hsk_level = ?, category = ?
      WHERE id = ?
    `).run(
      hanzi !== undefined ? hanzi.trim() : existing.hanzi,
      pinyin !== undefined ? pinyin.trim() : existing.pinyin,
      vietnamese_meaning !== undefined ? vietnamese_meaning.trim() : existing.vietnamese_meaning,
      example_sentence !== undefined ? example_sentence : existing.example_sentence,
      example_pinyin !== undefined ? example_pinyin : existing.example_pinyin,
      example_vi !== undefined ? example_vi : existing.example_vi,
      hsk_level !== undefined ? parseInt(hsk_level, 10) : existing.hsk_level,
      category !== undefined ? category : existing.category,
      parseInt(id, 10)
    );

    res.json({ success: true, message: 'Cập nhật từ vựng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa từ vựng
exports.deleteVocabulary = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy từ vựng' });
    }

    db.prepare('DELETE FROM vocabulary WHERE id = ?').run(parseInt(id, 10));
    res.json({ success: true, message: `Đã xóa từ vựng '${existing.hanzi}' thành công` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm ngữ pháp mới
exports.createGrammar = (req, res) => {
  try {
    const { title, structure, explanation, example_sentence, example_pinyin, example_vi, hsk_level = 1 } = req.body;
    if (!title || !structure) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên điểm ngữ pháp và cấu trúc' });
    }

    const result = db.prepare(`
      INSERT INTO grammar (title, structure, explanation, example_sentence, example_pinyin, example_vi, hsk_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title.trim(), structure.trim(), explanation || '', example_sentence || '', example_pinyin || '', example_vi || '', parseInt(hsk_level, 10));

    res.json({
      success: true,
      message: 'Thêm điểm ngữ pháp thành công',
      data: { id: result.lastInsertRowid, title, structure, hsk_level }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật ngữ pháp
exports.updateGrammar = (req, res) => {
  try {
    const { id } = req.params;
    const { title, structure, explanation, example_sentence, example_pinyin, example_vi, hsk_level } = req.body;

    const existing = db.prepare('SELECT * FROM grammar WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm ngữ pháp' });
    }

    db.prepare(`
      UPDATE grammar
      SET title = ?, structure = ?, explanation = ?, example_sentence = ?, example_pinyin = ?, example_vi = ?, hsk_level = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title.trim() : existing.title,
      structure !== undefined ? structure.trim() : existing.structure,
      explanation !== undefined ? explanation : existing.explanation,
      example_sentence !== undefined ? example_sentence : existing.example_sentence,
      example_pinyin !== undefined ? example_pinyin : existing.example_pinyin,
      example_vi !== undefined ? example_vi : existing.example_vi,
      hsk_level !== undefined ? parseInt(hsk_level, 10) : existing.hsk_level,
      parseInt(id, 10)
    );

    res.json({ success: true, message: 'Cập nhật điểm ngữ pháp thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa ngữ pháp
exports.deleteGrammar = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM grammar WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm ngữ pháp' });
    }

    db.prepare('DELETE FROM grammar WHERE id = ?').run(parseInt(id, 10));
    res.json({ success: true, message: `Đã xóa điểm ngữ pháp '${existing.title}' thành công` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm bài luyện nói
exports.createSpeaking = (req, res) => {
  try {
    const { title, prompt_cn, pinyin, vietnamese_meaning, difficulty, hsk_level } = req.body;
    if (!prompt_cn || !vietnamese_meaning) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền câu tiếng Trung và nghĩa tiếng Việt' });
    }

    const result = db.prepare(`
      INSERT INTO speaking_exercises (title, prompt_cn, pinyin, vietnamese_meaning, difficulty, hsk_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      title ? title.trim() : 'Luyện nói',
      prompt_cn.trim(),
      pinyin ? pinyin.trim() : '',
      vietnamese_meaning.trim(),
      difficulty || 'Trung bình',
      parseInt(hsk_level, 10) || 1
    );

    res.status(201).json({
      success: true,
      message: 'Thêm bài luyện nói thành công',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật bài luyện nói
exports.updateSpeaking = (req, res) => {
  try {
    const { id } = req.params;
    const { title, prompt, prompt_cn, pinyin, vietnamese_meaning, difficulty, hsk_level } = req.body;

    const existing = db.prepare('SELECT * FROM speaking_exercises WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài luyện nói' });
    }

    const finalPrompt = prompt_cn !== undefined ? prompt_cn : (prompt !== undefined ? prompt : existing.prompt_cn);

    db.prepare(`
      UPDATE speaking_exercises
      SET title = ?, prompt_cn = ?, pinyin = ?, vietnamese_meaning = ?, difficulty = ?, hsk_level = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : existing.title,
      finalPrompt,
      pinyin !== undefined ? pinyin : existing.pinyin,
      vietnamese_meaning !== undefined ? vietnamese_meaning : existing.vietnamese_meaning,
      difficulty !== undefined ? difficulty : (existing.difficulty || 'Trung bình'),
      hsk_level !== undefined ? parseInt(hsk_level, 10) : existing.hsk_level,
      parseInt(id, 10)
    );

    res.json({ success: true, message: 'Cập nhật bài luyện nói thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa bài luyện nói
exports.deleteSpeaking = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM speaking_exercises WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài luyện nói' });
    }

    db.prepare('DELETE FROM speaking_exercises WHERE id = ?').run(parseInt(id, 10));
    res.json({ success: true, message: 'Đã xóa bài luyện nói thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
