// API Helper service communicating with the Express backend

const BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('hsk_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('hsk_token', token);
  } else {
    localStorage.removeItem('hsk_token');
  }
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Lỗi yêu cầu: ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Google Sheets
  syncSheets: (data) => request('/sheets/sync', { method: 'POST', body: JSON.stringify(data) }),
  directSync: (data) => request('/sheets/direct-sync', { method: 'POST', body: JSON.stringify(data) }),
  getSyncLogs: () => request('/sheets/logs'),

  // AI Import
  uploadDocument: (formData) => request('/ai-import/upload', { method: 'POST', body: formData }),
  getImportPreview: (docId) => request(`/ai-import/preview/${docId}`),
  updateImportPreview: (docId, data) => request(`/ai-import/preview/${docId}`, { method: 'PUT', body: JSON.stringify(data) }),
  confirmImport: (docId, data) => request(`/ai-import/confirm/${docId}`, { method: 'POST', body: JSON.stringify(data) }),
  getImportHistory: () => request('/ai-import/history'),

  // Study
  getVocabulary: (params = '') => request(`/study/vocabulary${params}`),
  createVocabulary: (data) => request('/study/vocabulary', { method: 'POST', body: JSON.stringify(data) }),
  updateVocabulary: (id, data) => request(`/study/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVocabulary: (id) => request(`/study/vocabulary/${id}`, { method: 'DELETE' }),
  toggleStarVocab: (vocabularyId) => request('/study/vocabulary/star', { method: 'POST', body: JSON.stringify({ vocabularyId }) }),
  getStarredVocab: () => request('/study/vocabulary/starred'),

  getGrammar: (params = '') => request(`/study/grammar${params}`),
  createGrammar: (data) => request('/study/grammar', { method: 'POST', body: JSON.stringify(data) }),
  updateGrammar: (id, data) => request(`/study/grammar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGrammar: (id) => request(`/study/grammar/${id}`, { method: 'DELETE' }),

  getListening: (params = '') => request(`/study/listening${params}`),
  getListeningDetail: (id) => request(`/study/listening/${id}`),

  getSpeaking: (params = '') => request(`/study/speaking${params}`),
  createSpeaking: (data) => request('/study/speaking', { method: 'POST', body: JSON.stringify(data) }),
  updateSpeaking: (id, data) => request(`/study/speaking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSpeaking: (id) => request(`/study/speaking/${id}`, { method: 'DELETE' }),
  getReading: (params = '') => request(`/study/reading${params}`),
  getReadingDetail: (id) => request(`/study/reading/${id}`),
  getWriting: (params = '') => request(`/study/writing${params}`),
  recordProgress: (data) => request('/study/progress', { method: 'POST', body: JSON.stringify(data) }),

  // Exams
  getExams: (params = '') => request(`/exams/list${params}`),
  getExamDetail: (id) => request(`/exams/detail/${id}`),
  submitExam: (id, data) => request(`/exams/submit/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getExamHistory: () => request('/exams/history'),

  // AI Tutor
  askTutor: (data) => request('/ai-tutor/ask', { method: 'POST', body: JSON.stringify(data) }),

  // Users & Admin
  getUsers: (params = '') => request(`/users${params}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getDashboardStats: () => request('/users/dashboard-stats')
};

// Web Speech Synthesis for Chinese pronunciation
export function speakChinese(text) {
  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt của bạn không hỗ trợ phát âm Web Speech API');
    return;
  }
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; // Mainland Chinese pronunciation
  utterance.rate = 0.85; // Slightly slower for language learners
  window.speechSynthesis.speak(utterance);
}
