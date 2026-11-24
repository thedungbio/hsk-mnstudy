const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const dbFile = path.join(__dirname, 'hsk_platform_data.json');

// Memory storage for tables
const tables = {
  users: [],
  roles: [],
  vocabulary: [],
  user_starred_vocabulary: [],
  grammar: [],
  listening_materials: [],
  reading_materials: [],
  speaking_exercises: [],
  writing_exercises: [],
  hsk_exams: [],
  exam_results: [],
  learning_progress: [],
  uploaded_documents: [],
  imported_data: [],
  ai_processing_logs: [],
  sync_logs: [],
  audit_logs: []
};

// Auto increment counters
const autoIncrements = {};

// Ensure primary admin account is always present, active, and fully configured
function ensureHealthyAdmin() {
  if (!tables.users) tables.users = [];

  let admin = tables.users.find(u => u.id === 1 || u.username === 'admin');
  let modified = false;

  const defaultPasswordHash = bcrypt.hashSync('admin123', 10);

  if (!admin) {
    admin = {
      id: 1,
      username: 'admin',
      password_hash: defaultPasswordHash,
      full_name: 'Quản Trị Viên Hệ Thống',
      email: 'admin@hskmaster.edu.vn',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    tables.users.unshift(admin);
    modified = true;
    console.log('[DATABASE] Đã tự động khởi tạo tài khoản Quản trị viên chính (id: 1, username: admin, status: active).');
  } else {
    if (admin.id !== 1) {
      const otherUser = tables.users.find(u => u.id === 1);
      if (otherUser && otherUser !== admin) {
        const nextId = tables.users.reduce((max, r) => (r.id > max ? r.id : max), 0) + 1;
        otherUser.id = nextId;
      }
      admin.id = 1;
      modified = true;
    }

    if (admin.username !== 'admin') {
      admin.username = 'admin';
      modified = true;
    }

    if (admin.role !== 'admin') {
      console.warn(`[DATABASE HEALING] Khôi phục quyền Quản trị viên từ '${admin.role}' thành 'admin'.`);
      admin.role = 'admin';
      modified = true;
    }

    if (admin.status !== 'active') {
      console.warn(`[DATABASE HEALING] Mở khóa và khôi phục trạng thái Quản trị viên từ '${admin.status}' thành 'active'.`);
      admin.status = 'active';
      modified = true;
    }

    if (!admin.password_hash || typeof admin.password_hash !== 'string' || admin.password_hash.length < 10) {
      console.warn('[DATABASE HEALING] Đặt lại mật khẩu Quản trị viên mặc định (admin123).');
      admin.password_hash = defaultPasswordHash;
      modified = true;
    }

    if (!admin.full_name) {
      admin.full_name = 'Quản Trị Viên Hệ Thống';
      modified = true;
    }

    if (!admin.email) {
      admin.email = 'admin@hskmaster.edu.vn';
      modified = true;
    }
  }

  const maxId = tables.users.reduce((max, r) => (r.id > max ? r.id : max), 0);
  if (!autoIncrements.users || autoIncrements.users <= maxId) {
    autoIncrements.users = maxId + 1;
  }

  if (modified) {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(tables, null, 2), 'utf-8');
      console.log('[DATABASE] Đã đồng bộ tài khoản Quản trị viên an toàn vào file database.');
    } catch (e) {
      console.error('Lỗi lưu database file khi phục hồi admin:', e.message);
    }
  }
}

// Load data from disk if exists
function loadFromDisk() {
  if (fs.existsSync(dbFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      for (const key of Object.keys(tables)) {
        if (Array.isArray(data[key])) {
          tables[key] = data[key];
          const maxId = tables[key].reduce((max, r) => (r.id > max ? r.id : max), 0);
          autoIncrements[key] = maxId + 1;
        }
      }
    } catch (e) {
      console.error('Lỗi đọc database file:', e.message);
    }
  }
  ensureHealthyAdmin();
}

// Save data to disk
let saveTimeout = null;
function persistToDisk(immediate = false) {
  if (saveTimeout) clearTimeout(saveTimeout);
  const doSave = () => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(tables, null, 2), 'utf-8');
    } catch (e) {
      console.error('Lỗi lưu database file:', e.message);
    }
  };
  if (immediate) {
    doSave();
  } else {
    saveTimeout = setTimeout(doSave, 50);
  }
}

loadFromDisk();

// Database abstraction layer supporting SQLite-like prepare().run() / get() / all()
const db = {
  pragma: () => {},
  exec: (schemaSql) => {
    // Schema initialized in tables
  },
  transaction: (fn) => {
    return (...args) => {
      const res = fn(...args);
      persistToDisk();
      return res;
    };
  },
  prepare: (sql) => {
    const trimmed = sql.trim();

    return {
      run: (...params) => {
        // --- 1. INSERT ---
        if (/^INSERT/i.test(trimmed)) {
          const tableMatch = trimmed.match(/INSERT(?:\s+OR\s+IGNORE)?\s+INTO\s+([a-zA-Z0-9_]+)/i);
          if (!tableMatch) return { lastInsertRowid: 0, changes: 0 };
          const tableName = tableMatch[1].toLowerCase();
          if (!tables[tableName]) tables[tableName] = [];

          // Parse column names
          const colMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
          const columns = colMatch ? colMatch[1].split(',').map(c => c.trim()) : [];

          const newId = autoIncrements[tableName] || (tables[tableName].length + 1);
          autoIncrements[tableName] = newId + 1;

          const record = { id: newId, created_at: new Date().toISOString() };
          columns.forEach((col, idx) => {
            record[col] = params[idx] !== undefined ? params[idx] : null;
          });

          // Check UNIQUE constraints for IGNORE
          if (/INSERT\s+OR\s+IGNORE/i.test(trimmed)) {
            if (tableName === 'users' && tables.users.some(u => u.username === record.username)) {
              return { lastInsertRowid: 0, changes: 0 };
            }
            if (tableName === 'roles' && tables.roles.some(r => r.name === record.name)) {
              return { lastInsertRowid: 0, changes: 0 };
            }
          }

          tables[tableName].push(record);
          persistToDisk();
          return { lastInsertRowid: newId, changes: 1 };
        }

        // --- 2. UPDATE ---
        if (/^UPDATE/i.test(trimmed)) {
          const tableMatch = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
          if (!tableMatch) return { changes: 0 };
          const tableName = tableMatch[1].toLowerCase();
          const table = tables[tableName] || [];

          let changes = 0;
          if (/WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
            const idVal = parseInt(params[params.length - 1], 10);
            const target = table.find(r => r.id === idVal);
            if (target) {
              const isPrimaryAdmin = (tableName === 'users' && (target.id === 1 || target.username === 'admin'));

              if (/SET\s+status\s*=\s*\?/i.test(trimmed)) {
                if (isPrimaryAdmin && params[0] !== 'active') {
                  console.warn(`[SECURITY] Thao tác thay đổi trạng thái admin thành '${params[0]}' đã bị chặn! Admin luôn ở trạng thái 'active'.`);
                  return { changes: 0 };
                }
                target.status = params[0];
                target.updated_at = new Date().toISOString();
                changes = 1;
              } else if (/SET\s+password_hash\s*=\s*\?/i.test(trimmed)) {
                target.password_hash = params[0];
                target.updated_at = new Date().toISOString();
                changes = 1;
              } else if (/SET\s+status\s*=\s*['"]imported['"]/i.test(trimmed)) {
                target.status = 'imported';
                changes = 1;
              } else if (/SET\s+status\s*=\s*['"]approved['"]/i.test(trimmed)) {
                target.status = 'approved';
                changes = 1;
              } else if (/SET\s+completed_items_count/i.test(trimmed)) {
                target.completed_items_count = (target.completed_items_count || 0) + params[0];
                target.last_studied_at = new Date().toISOString();
                changes = 1;
              } else if (tableName === 'users') {
                if (/full_name.*email.*password_hash/i.test(trimmed)) {
                  target.full_name = params[0] !== undefined ? params[0] : target.full_name;
                  target.email = params[1] !== undefined ? params[1] : target.email;
                  target.password_hash = params[2] !== undefined ? params[2] : target.password_hash;
                } else if (/full_name.*email/i.test(trimmed)) {
                  target.full_name = params[0] !== undefined ? params[0] : target.full_name;
                  target.email = params[1] !== undefined ? params[1] : target.email;
                } else if (/full_name/i.test(trimmed)) {
                  target.full_name = params[0] !== undefined ? params[0] : target.full_name;
                } else if (/email/i.test(trimmed)) {
                  target.email = params[0] !== undefined ? params[0] : target.email;
                }
                target.updated_at = new Date().toISOString();
                changes = 1;
              } else {
                // Bộ cập nhật cột đa năng cho vocabulary, grammar, speaking, etc.
                const setClauseMatch = trimmed.match(/SET\s+(.+)\s+WHERE\s+id\s*=\s*\?/i);
                if (setClauseMatch) {
                  const cols = setClauseMatch[1].split(',').map(s => s.trim().split('=')[0].trim());
                  cols.forEach((col, idx) => {
                    if (params[idx] !== undefined) {
                      target[col] = params[idx];
                    }
                  });
                  target.updated_at = new Date().toISOString();
                  changes = 1;
                }
              }
            }
          } else if (/WHERE\s+document_id\s*=\s*\?/i.test(trimmed)) {
            const docId = parseInt(params[params.length - 1], 10);
            const target = table.find(r => r.document_id === docId);
            if (target && /SET\s+structured_json\s*=\s*\?/i.test(trimmed)) {
              target.structured_json = params[0];
              changes = 1;
            }
          } else if (/WHERE\s+username\s*=\s*\?/i.test(trimmed)) {
            const uName = params[params.length - 1];
            const target = table.find(r => r.username === uName);
            if (target) {
              const isPrimaryAdmin = (tableName === 'users' && (target.id === 1 || target.username === 'admin'));

              if (/SET\s+full_name/i.test(trimmed)) {
                target.full_name = params[0] !== undefined ? params[0] : target.full_name;
                target.email = params[1] !== undefined ? params[1] : target.email;
                
                if (isPrimaryAdmin) {
                  if (params[2] && params[2] !== 'admin') {
                    console.warn(`[SECURITY] Thao tác giáng cấp quyền Quản trị viên thành '${params[2]}' đã bị chặn! Giữ nguyên role 'admin'.`);
                  }
                  target.role = 'admin';

                  if (params[3] && params[3] !== 'active') {
                    console.warn(`[SECURITY] Thao tác khóa/xóa Quản trị viên (status='${params[3]}') đã bị chặn! Giữ nguyên status 'active'.`);
                  }
                  target.status = 'active';
                } else {
                  target.role = params[2] !== undefined ? params[2] : target.role;
                  target.status = params[3] !== undefined ? params[3] : target.status;
                }
                target.updated_at = new Date().toISOString();
                changes = 1;
              } else if (/SET\s+password_hash/i.test(trimmed)) {
                target.password_hash = params[0];
                target.updated_at = new Date().toISOString();
                changes = 1;
              }
            }
          }

          persistToDisk();
          return { changes };
        }

        // --- 3. DELETE ---
        if (/^DELETE/i.test(trimmed)) {
          const tableMatch = trimmed.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
          if (!tableMatch) return { changes: 0 };
          const tableName = tableMatch[1].toLowerCase();

          if (/WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
            const idVal = parseInt(params[0], 10);
            if (tableName === 'users') {
              const target = tables.users.find(r => r.id === idVal);
              if (target && (target.id === 1 || target.username === 'admin' || target.role === 'admin')) {
                console.warn(`[SECURITY] Thao tác xóa Quản trị viên chính (id: ${idVal}, username: ${target.username}) bị chặn vĩnh viễn!`);
                return { changes: 0 };
              }
            }
            if (tableName === 'vocabulary' && tables.user_starred_vocabulary) {
              tables.user_starred_vocabulary = tables.user_starred_vocabulary.filter(s => s.vocabulary_id !== idVal);
            }
            const initLen = tables[tableName].length;
            tables[tableName] = tables[tableName].filter(r => r.id !== idVal);
            persistToDisk();
            return { changes: initLen - tables[tableName].length };
          }

          if (/WHERE\s+username\s*=\s*\?/i.test(trimmed)) {
            const uName = params[0];
            if (tableName === 'users') {
              if (uName === 'admin' || tables.users.some(r => r.username === uName && (r.id === 1 || r.role === 'admin'))) {
                console.warn(`[SECURITY] Thao tác xóa Quản trị viên chính (username: ${uName}) bị chặn vĩnh viễn!`);
                return { changes: 0 };
              }
            }
            const initLen = tables[tableName].length;
            tables[tableName] = tables[tableName].filter(r => r.username !== uName);
            persistToDisk();
            return { changes: initLen - tables[tableName].length };
          }

          return { changes: 0 };
        }

        return { changes: 0 };
      },

      get: (...params) => {
        // COUNT queries
        if (/SELECT\s+count\(\*\)\s+as\s+count\s+FROM\s+([a-zA-Z0-9_]+)/i.test(trimmed)) {
          const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
          const tableName = match[1].toLowerCase();
          const table = tables[tableName] || [];
          if (!match[2]) return { count: table.length };

          // Handled conditions
          if (/status\s*!=\s*['"]deleted['"]/i.test(match[2])) {
            return { count: table.filter(r => r.status !== 'deleted').length };
          }
          if (/role\s*=\s*['"]student['"]\s+AND\s+status\s*=\s*['"]active['"]/i.test(match[2])) {
            return { count: table.filter(r => r.role === 'student' && r.status === 'active').length };
          }
          if (/role\s*=\s*['"]teacher['"]\s+AND\s+status\s*=\s*['"]active['"]/i.test(match[2])) {
            return { count: table.filter(r => r.role === 'teacher' && r.status === 'active').length };
          }
          if (/user_id\s*=\s*\?/i.test(match[2])) {
            return { count: table.filter(r => r.user_id === parseInt(params[0], 10)).length };
          }
          return { count: table.length };
        }

        // Specific single record queries
        if (/FROM\s+users\s+WHERE\s+username\s*=\s*(\?|'[^']+')/i.test(trimmed)) {
          const match = trimmed.match(/WHERE\s+username\s*=\s*(?:'([^']+)'|\?)/i);
          const uVal = (match && match[1]) ? match[1] : params[0];
          return tables.users.find(u => u.username === uVal) || null;
        }
        if (/FROM\s+users\s+WHERE\s+id\s*=\s*(\?|\d+)/i.test(trimmed)) {
          const match = trimmed.match(/WHERE\s+id\s*=\s*(\d+|\?)/i);
          const idVal = (match && match[1] !== '?') ? parseInt(match[1], 10) : parseInt(params[0], 10);
          return tables.users.find(u => u.id === idVal) || null;
        }
        if (/FROM\s+users\s+WHERE\s+email\s*=\s*(\?|'[^']+')/i.test(trimmed)) {
          const match = trimmed.match(/WHERE\s+email\s*=\s*(?:'([^']+)'|\?)/i);
          const eVal = (match && match[1]) ? match[1] : params[0];
          return tables.users.find(u => u.email === eVal) || null;
        }
        // Generic single record by id (vocabulary, grammar, speaking_exercises, etc.)
        const genericIdMatch = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+id\s*=\s*(\d+|\?)/i);
        if (genericIdMatch) {
          const tName = genericIdMatch[1].toLowerCase();
          const targetId = genericIdMatch[2] !== '?' ? parseInt(genericIdMatch[2], 10) : parseInt(params[0], 10);
          if (tables[tName]) {
            return tables[tName].find(item => item.id === targetId) || null;
          }
        }

        if (/FROM\s+vocabulary\s+WHERE\s+hanzi\s*=\s*\?/i.test(trimmed)) {
          return tables.vocabulary.find(v => v.hanzi === params[0]) || null;
        }
        if (/FROM\s+hsk_exams\s+WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
          return tables.hsk_exams.find(e => e.id === parseInt(params[0], 10)) || null;
        }
        if (/FROM\s+listening_materials\s+WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
          return tables.listening_materials.find(m => m.id === parseInt(params[0], 10)) || null;
        }
        if (/FROM\s+reading_materials\s+WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
          return tables.reading_materials.find(m => m.id === parseInt(params[0], 10)) || null;
        }
        if (/FROM\s+uploaded_documents\s+WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
          return tables.uploaded_documents.find(d => d.id === parseInt(params[0], 10)) || null;
        }
        if (/FROM\s+imported_data\s+WHERE\s+document_id\s*=\s*\?/i.test(trimmed)) {
          const docId = parseInt(params[0], 10);
          return tables.imported_data.slice().reverse().find(d => d.document_id === docId) || null;
        }
        if (/FROM\s+learning_progress\s+WHERE\s+user_id\s*=\s*\?\s+AND\s+skill\s*=\s*\?/i.test(trimmed)) {
          const uid = parseInt(params[0], 10);
          const skill = params[1];
          return tables.learning_progress.find(p => p.user_id === uid && p.skill === skill) || null;
        }
        if (/FROM\s+user_starred_vocabulary\s+WHERE\s+user_id\s*=\s*\?\s+AND\s+vocabulary_id\s*=\s*\?/i.test(trimmed)) {
          const uid = parseInt(params[0], 10);
          const vid = parseInt(params[1], 10);
          return tables.user_starred_vocabulary.find(s => s.user_id === uid && s.vocabulary_id === vid) || null;
        }

        return null;
      },

      all: (...params) => {
        // Vocabulary list
        if (/FROM\s+vocabulary/i.test(trimmed)) {
          const userId = params[0];
          let results = tables.vocabulary.map(v => {
            const isStarred = tables.user_starred_vocabulary.some(s => s.user_id === userId && s.vocabulary_id === v.id);
            return { ...v, is_starred: isStarred ? 1 : 0 };
          });

          // Check HSK filter in params
          for (const p of params) {
            if (typeof p === 'number' && p >= 1 && p <= 9) {
              results = results.filter(r => r.hsk_level === p);
              break;
            }
          }
          return results;
        }

        // Starred vocabulary
        if (/FROM\s+vocabulary\s+v\s+JOIN\s+user_starred_vocabulary/i.test(trimmed)) {
          const userId = params[0];
          const starredIds = tables.user_starred_vocabulary.filter(s => s.user_id === userId).map(s => s.vocabulary_id);
          return tables.vocabulary.filter(v => starredIds.includes(v.id)).map(v => ({ ...v, is_starred: 1 }));
        }

        // Grammar list
        if (/FROM\s+grammar/i.test(trimmed)) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return tables.grammar.filter(g => g.hsk_level === params[0]);
          }
          return tables.grammar;
        }

        // Listening list
        if (/FROM\s+listening_materials/i.test(trimmed)) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return tables.listening_materials.filter(m => m.hsk_level === params[0]);
          }
          return tables.listening_materials;
        }

        // Speaking list
        if (/FROM\s+speaking_exercises/i.test(trimmed)) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return tables.speaking_exercises.filter(s => s.hsk_level === params[0]);
          }
          return tables.speaking_exercises;
        }

        // Reading list
        if (/FROM\s+reading_materials/i.test(trimmed)) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return tables.reading_materials.filter(r => r.hsk_level === params[0]);
          }
          return tables.reading_materials;
        }

        // Writing list
        if (/FROM\s+writing_exercises/i.test(trimmed)) {
          let list = tables.writing_exercises;
          for (const p of params) {
            if (typeof p === 'string' && ['hanzi_stroke', 'sentence_reorder', 'essay'].includes(p)) {
              list = list.filter(w => w.type === p);
            }
          }
          return list;
        }

        // HSK Exams list
        if (/FROM\s+hsk_exams/i.test(trimmed)) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return tables.hsk_exams.filter(e => e.hsk_level === params[0]);
          }
          return tables.hsk_exams;
        }

        // Exam results history
        if (/FROM\s+exam_results\s+r\s+JOIN\s+hsk_exams/i.test(trimmed)) {
          const userId = params[0];
          return tables.exam_results
            .filter(r => r.user_id === userId)
            .map(r => {
              const ex = tables.hsk_exams.find(e => e.id === r.exam_id) || {};
              return {
                ...r,
                exam_title: ex.title || 'Đề thi HSK',
                hsk_level: ex.hsk_level || 1,
                passing_score: ex.passing_score || 180
              };
            })
            .reverse();
        }

        // Recent results for Admin dashboard
        if (/FROM\s+exam_results\s+r\s+JOIN\s+users/i.test(trimmed)) {
          return tables.exam_results.slice(-10).reverse().map(r => {
            const u = tables.users.find(usr => usr.id === r.user_id) || {};
            const e = tables.hsk_exams.find(ex => ex.id === r.exam_id) || {};
            return {
              ...r,
              student_name: u.full_name || 'Học viên',
              exam_title: e.title || 'Đề thi',
              hsk_level: e.hsk_level || 1
            };
          });
        }

        // Vocab by HSK for Admin Chart
        if (/GROUP\s+BY\s+hsk_level/i.test(trimmed)) {
          const counts = {};
          tables.vocabulary.forEach(v => {
            counts[v.hsk_level] = (counts[v.hsk_level] || 0) + 1;
          });
          return Object.keys(counts).map(lvl => ({
            hsk_level: parseInt(lvl, 10),
            count: counts[lvl]
          })).sort((a, b) => a.hsk_level - b.hsk_level);
        }

        // Users list
        if (/FROM\s+users/i.test(trimmed)) {
          let list = [...tables.users];
          if (params.includes('student') || /role\s*=\s*['"]student['"]/i.test(trimmed)) list = list.filter(u => u.role === 'student');
          if (params.includes('teacher') || /role\s*=\s*['"]teacher['"]/i.test(trimmed)) list = list.filter(u => u.role === 'teacher');
          if (params.includes('admin') || /role\s*=\s*['"]admin['"]/i.test(trimmed)) list = list.filter(u => u.role === 'admin');

          if (params.includes('active')) list = list.filter(u => u.status === 'active');
          if (params.includes('locked')) list = list.filter(u => u.status === 'locked');
          if (params.includes('deleted')) list = list.filter(u => u.status === 'deleted');

          const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
          if (searchParam) {
            const kw = searchParam.slice(1, -1).toLowerCase();
            list = list.filter(u =>
              (u.username && u.username.toLowerCase().includes(kw)) ||
              (u.full_name && u.full_name.toLowerCase().includes(kw)) ||
              (u.email && u.email.toLowerCase().includes(kw))
            );
          }

          if (/ORDER\s+BY\s+id\s+DESC/i.test(trimmed)) {
            list.sort((a, b) => b.id - a.id);
          }

          if (/LIMIT\s+\?\s+OFFSET\s+\?/i.test(trimmed)) {
            const limitVal = params[params.length - 2];
            const offsetVal = params[params.length - 1];
            if (typeof limitVal === 'number' && typeof offsetVal === 'number') {
              list = list.slice(offsetVal, offsetVal + limitVal);
            }
          }

          return list;
        }

        // Audit logs
        if (/FROM\s+audit_logs/i.test(trimmed)) {
          return (tables.audit_logs || []).slice(-100).reverse();
        }

        // Sync logs
        if (/FROM\s+sync_logs/i.test(trimmed)) {
          return tables.sync_logs.slice(-50).reverse();
        }

        // Uploaded documents history
        if (/FROM\s+uploaded_documents/i.test(trimmed)) {
          return tables.uploaded_documents.slice(-30).reverse();
        }

        // Learning progress
        if (/FROM\s+learning_progress\s+WHERE\s+user_id\s*=\s*\?/i.test(trimmed)) {
          const uid = parseInt(params[0], 10);
          return tables.learning_progress.filter(p => p.user_id === uid);
        }

        return [];
      }
    };
  }
};

module.exports = db;
