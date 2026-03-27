import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parsePdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text.trim();
}

// Split large text into chunks for AI processing
export function chunkText(text, size = 1500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype || '';

  try {
    // PDF
    if (ext === '.pdf' || mime.includes('pdf')) {
      return await parsePdf(file.path);
    }

    // Excel / CSV
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv' || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) {
      const workbook = xlsx.readFile(file.path);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        text += `Sheet: ${sheetName}\n`;
        rows.forEach(row => { text += row.join(' | ') + '\n'; });
        text += '\n';
      });
      return text.trim();
    }

    // Word documents
    if (ext === '.docx' || mime.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ path: file.path });
      return result.value.trim();
    }

    // Images (OCR)
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || mime.includes('image')) {
      const { data } = await Tesseract.recognize(file.path, 'eng', { logger: () => {} });
      return data.text.trim();
    }

    // Plain text
    if (ext === '.txt' || mime.includes('text/plain')) {
      return fs.readFileSync(file.path, 'utf-8').trim();
    }

    return null;
  } finally {
    // Clean up uploaded file
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }
  }
}
