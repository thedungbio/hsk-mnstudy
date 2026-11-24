const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const documentParser = require('../services/documentParserService');
const aiAnalysis = require('../services/aiAnalysisService');

exports.uploadAndAnalyze = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file tài liệu để tải lên' });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();

    // 1. Kiểm tra an toàn: Chặn tuyệt đối file thực thi
    const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs'];
    if (forbiddenExts.includes(ext)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Từ chối: File thực thi (.exe, .bat, v.v.) không phải định dạng dữ liệu học tập hợp lệ.'
      });
    }

    // 2. Trích xuất nội dung văn bản
    const rawText = await documentParser.extractTextFromFile(file.path, file.originalname);

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể trích xuất nội dung từ file hoặc file trống.'
      });
    }

    // 3. Phân tích nội dung qua AI / NLP
    const targetCategory = req.body.target_category || 'auto';
    const analysisResult = await aiAnalysis.analyzeDocumentContent(rawText, file.originalname, targetCategory);

    // 4. Lưu thông tin tài liệu vào DB
    const insertDocStmt = db.prepare(`
      INSERT INTO uploaded_documents (original_name, file_type, file_size, file_path, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, 'preview_ready')
    `);
    const docInfo = insertDocStmt.run(file.originalname, ext, file.size, file.path, req.user ? req.user.id : null);
    const documentId = docInfo.lastInsertRowid;

    // 5. Lưu bản ghi dữ liệu chờ duyệt (Preview)
    const insertImportData = db.prepare(`
      INSERT INTO imported_data (document_id, recognized_type, raw_extracted, structured_json, status)
      VALUES (?, ?, ?, ?, 'preview')
    `);
    const importDataInfo = insertImportData.run(
      documentId,
      analysisResult.recognizedType,
      rawText.substring(0, 5000), // Lưu một phần raw text
      JSON.stringify(analysisResult)
    );

    // 6. Ghi log xử lý AI
    db.prepare(`
      INSERT INTO ai_processing_logs (document_id, model_used, action_type, status, log_message)
      VALUES (?, ?, ?, ?, ?)
    `).run(documentId, 'AI-NLP-Classifier-v2', 'DOCUMENT_IMPORT', 'SUCCESS', `Trích xuất ${analysisResult.summary.totalVocabularyFound} từ vựng, ${analysisResult.summary.totalQuestionsFound} câu hỏi.`);

    res.json({
      success: true,
      message: 'Tài liệu đã được tải lên và phân tích thành công. Vui lòng xem trước và xác nhận.',
      document_id: documentId,
      data_id: importDataInfo.lastInsertRowid,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Lỗi phân tích tài liệu:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý tài liệu học tập'
    });
  }
};

exports.getPreviewData = (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = db.prepare('SELECT * FROM uploaded_documents WHERE id = ?').get(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });
    }

    const imported = db.prepare('SELECT * FROM imported_data WHERE document_id = ? ORDER BY id DESC LIMIT 1').get(documentId);
    if (!imported) {
      return res.status(404).json({ success: false, message: 'Chưa có dữ liệu phân tích' });
    }

    res.json({
      success: true,
      document: doc,
      importData: {
        ...imported,
        structured_json: JSON.parse(imported.structured_json)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePreviewData = (req, res) => {
  try {
    const { documentId } = req.params;
    const { structured_json } = req.body;

    if (!structured_json) {
      return res.status(400).json({ success: false, message: 'Dữ liệu cập nhật không được để trống' });
    }

    db.prepare(`
      UPDATE imported_data
      SET structured_json = ?
      WHERE document_id = ?
    `).run(JSON.stringify(structured_json), documentId);

    res.json({ success: true, message: 'Cập nhật bản xem trước thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmImport = (req, res) => {
  try {
    const { documentId } = req.params;
    const { target_hsk_level, override_duplicates, structured_json } = req.body;

    const imported = db.prepare('SELECT * FROM imported_data WHERE document_id = ? AND status = "preview"').get(documentId);
    if (!imported) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu preview hợp lệ để duyệt' });
    }

    let data;
    if (structured_json) {
      data = structured_json;
      db.prepare('UPDATE imported_data SET structured_json = ? WHERE document_id = ?').run(JSON.stringify(structured_json), documentId);
    } else {
      data = JSON.parse(imported.structured_json);
    }

    let addedVocab = 0;
    let skippedVocab = 0;
    let addedQuestions = 0;
    let addedGrammar = 0;

    const checkVocab = db.prepare('SELECT id FROM vocabulary WHERE hanzi = ?');
    const insertVocab = db.prepare(`
      INSERT INTO vocabulary (hanzi, pinyin, vietnamese_meaning, hsk_level, category, example_cn, example_vi)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Lưu từ vựng nếu có
    if (Array.isArray(data.vocabulary) && data.vocabulary.length > 0) {
      const runVocabInsert = db.transaction((list) => {
        for (const item of list) {
          const hanzi = (item.hanzi || '').trim();
          if (!hanzi) continue;

          const existing = checkVocab.get(hanzi);
          if (existing && !override_duplicates) {
            skippedVocab++;
            continue;
          }

          const hsk = target_hsk_level ? parseInt(target_hsk_level, 10) : (item.hsk_level || 1);
          insertVocab.run(
            hanzi,
            item.pinyin || '',
            item.vietnamese_meaning || '',
            hsk,
            item.category || 'Nhập từ tài liệu',
            item.example_cn || '',
            item.example_vi || ''
          );
          addedVocab++;
        }
      });
      runVocabInsert(data.vocabulary);
    }

    // Lưu ngữ pháp nếu có
    if (Array.isArray(data.grammar) && data.grammar.length > 0) {
      const hsk = target_hsk_level ? parseInt(target_hsk_level, 10) : 1;
      const insertGrammar = db.prepare(`
        INSERT INTO grammar (title, structure, explanation, example_sentence, example_pinyin, example_vi, hsk_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const g of data.grammar) {
        if (!g.title) continue;
        insertGrammar.run(
          g.title.trim(),
          g.structure || '',
          g.explanation || '',
          g.example_sentence || '',
          g.example_pinyin || '',
          g.example_vi || '',
          g.hsk_level ? parseInt(g.hsk_level, 10) : hsk
        );
        addedGrammar++;
      }
    }

    // Lưu đề thi nếu có câu hỏi
    if (Array.isArray(data.questions) && data.questions.length > 0) {
      const hsk = target_hsk_level ? parseInt(target_hsk_level, 10) : 1;
      const examTitle = `Bộ Đề Luyện Tập HSK ${hsk} - Nhập từ tài liệu ngày ${new Date().toLocaleDateString('vi-VN')}`;
      
      db.prepare(`
        INSERT INTO hsk_exams (title, hsk_level, duration_minutes, total_questions, passing_score, sections)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        examTitle,
        hsk,
        data.questions.length * 2,
        data.questions.length,
        Math.floor(data.questions.length * 6),
        JSON.stringify({
          reading: {
            title: 'Phần thi đọc hiểu & trắc nghiệm tổng hợp',
            questions: data.questions
          }
        })
      );
      addedQuestions = data.questions.length;
    }

    // Cập nhật trạng thái sang 'imported' và 'approved'
    db.prepare('UPDATE uploaded_documents SET status = "imported" WHERE id = ?').run(documentId);
    db.prepare('UPDATE imported_data SET status = "approved" WHERE id = ?').run(imported.id);

    // Ghi audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target, details)
      VALUES (?, 'CONFIRM_IMPORT', 'imported_data', ?)
    `).run(
      req.user ? req.user.id : null,
      JSON.stringify({ documentId, addedVocab, skippedVocab, addedQuestions, addedGrammar })
    );

    res.json({
      success: true,
      message: `Nhập dữ liệu thành công! Đã thêm ${addedVocab} từ vựng (${skippedVocab} trùng lặp), ${addedGrammar} ngữ pháp, ${addedQuestions} câu hỏi vào hệ thống.`,
      stats: { addedVocab, skippedVocab, addedGrammar, addedQuestions }
    });
  } catch (error) {
    console.error('Lỗi xác nhận nhập tài liệu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getImportHistory = (req, res) => {
  try {
    const list = db.prepare(`
      SELECT d.*, u.full_name as uploaded_by_name
      FROM uploaded_documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.created_at DESC
      LIMIT 30
    `).all();

    res.json({ success: true, history: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
