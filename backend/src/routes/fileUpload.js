import { Router } from 'express';
import multer from 'multer';
import { extractText, chunkText } from '../services/fileExtractor.js';
import { callBART, callMistral } from '../services/hf.js';

const router = Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Summarize chunks sequentially
async function summarizeChunks(text) {
  const chunks = chunkText(text, 1500);
  const summaries = [];
  for (const chunk of chunks.slice(0, 5)) { // max 5 chunks
    if (chunk.trim().length < 50) continue;
    try {
      const s = await callBART(chunk);
      if (s) summaries.push(s);
    } catch { /* skip failed chunk */ }
  }
  return summaries.join(' ');
}

// POST /api/ai/upload/summarize
router.post('/summarize', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = await extractText(req.file);
  if (!text) return res.status(422).json({ error: 'Could not extract text from this file type. Supported: PDF, Excel, DOCX, TXT, PNG/JPG' });
  if (text.length < 50) return res.status(422).json({ error: 'File content too short to summarize' });

  try {
    const summary = await summarizeChunks(text);
    const bullets = summary.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15).map(s => `• ${s}`);
    res.json({ summary: bullets.length ? bullets : [`• ${summary}`], rawText: text.slice(0, 500) + (text.length > 500 ? '...' : ''), charCount: text.length });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'AI summarization failed. Please try again.' });
  }
});

// POST /api/ai/upload/flashcards
router.post('/flashcards', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = await extractText(req.file);
  if (!text) return res.status(422).json({ error: 'Could not extract text from this file' });

  try {
    const prompt = `Create exactly 10 flashcards from this content. Use this exact format for each:
Q: [question]
A: [answer]

Content: ${text.slice(0, 3000)}

Generate 10 flashcards now:`;

    const aiText = await callMistral(prompt);
    const cards = parseFlashcards(aiText);
    res.json({ flashcards: cards, count: cards.length });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Flashcard generation failed. Please try again.' });
  }
});

// POST /api/ai/upload/quiz-from-file
router.post('/quiz-from-file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = await extractText(req.file);
  if (!text) return res.status(422).json({ error: 'Could not extract text from this file' });

  try {
    const prompt = `Generate 5 multiple choice questions from this content.
For each question use this exact format:
1. [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [A/B/C/D]

Content: ${text.slice(0, 2000)}

Generate 5 MCQ questions now:`;

    const aiText = await callMistral(prompt);
    res.json({ quiz: aiText, rawText: text.slice(0, 300) });
  } catch (err) {
    res.status(502).json({ error: 'Quiz generation from file failed.' });
  }
});

function parseFlashcards(text) {
  const cards = [];
  const lines = text.split('\n');
  let currentQ = null;

  for (const line of lines) {
    const qMatch = line.match(/^Q[:\s]+(.+)/i);
    const aMatch = line.match(/^A[:\s]+(.+)/i);
    if (qMatch) { currentQ = qMatch[1].trim(); }
    else if (aMatch && currentQ) {
      cards.push({ id: cards.length + 1, question: currentQ, answer: aMatch[1].trim() });
      currentQ = null;
    }
  }
  return cards;
}

export default router;
