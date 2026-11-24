const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  // Gracefully handle pdf-parse compatibility
}

/**
 * Trích xuất nội dung văn bản từ các định dạng file được hỗ trợ
 */
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  // Kiểm tra an toàn: từ chối tuyệt đối file thực thi
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.ps1', '.dll', '.com'];
  if (dangerousExts.includes(ext)) {
    throw new Error('Cảnh báo an toàn: File thực thi (.exe, .bat, v.v.) bị nghiêm cấm trên hệ thống học tập.');
  }

  if (ext === '.docx' || ext === '.doc') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(filePath);
    let fullText = '';
    const tableData = [];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      tableData.push({ sheet: sheetName, rows: json });

      json.forEach(row => {
        if (Array.isArray(row) && row.length > 0) {
          fullText += row.join(' | ') + '\n';
        }
      });
    });

    return fullText;
  }

  if (ext === '.pdf') {
    if (!pdfParse) {
      try {
        pdfParse = require('pdf-parse');
      } catch (err) {
        throw new Error('Tính năng đọc PDF tạm thời không khả dụng do phiên bản Node.js. Vui lòng chuyển đổi sang file Word (.docx), Excel (.xlsx) hoặc TXT.');
      }
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  if (ext === '.txt' || ext === '.csv') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  throw new Error(`Định dạng file ${ext} không được hỗ trợ. Vui lòng tải file Word (.docx), Excel (.xlsx), PDF, TXT hoặc CSV.`);
}

module.exports = {
  extractTextFromFile
};
