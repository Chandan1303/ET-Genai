import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store.js';
import { callMistral } from '../services/hf.js';

const router = Router();

// In-memory quiz cache: { [quizId]: { questions, topic, type } }
const quizCache = {};

function parseMCQ(text, topic) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let current = null;

  for (const line of lines) {
    // Match question line: "1." or "1)" at start, optionally followed by "Question text here:"
    const qMatch = line.match(/^(\d+)[.)]\s+(?:Question text here[:\s]*)?(.+)/i);
    // Match option line: "A)" or "A." or "A -"
    const optMatch = line.match(/^([A-D])[).\s]\s*(.+)/);
    // Match answer line: "Answer: C" or "Correct Answer: C"
    const ansMatch = line.match(/^(?:Correct\s+)?Answer[:\s]+([A-D])/i);

    if (qMatch && !optMatch) {
      // Save previous question
      if (current) questions.push(current);
      current = {
        id: uuidv4(),
        type: 'mcq',
        question: qMatch[2].trim(),
        options: [],
        answer: 'A',
      };
    } else if (optMatch && current) {
      current.options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
    } else if (ansMatch && current) {
      current.answer = ansMatch[1].toUpperCase();
    }
  }
  if (current) questions.push(current);

  // Ensure all questions have 4 options (fill missing ones)
  return questions.map((q, i) => {
    if (q.options.length === 0) {
      q.options = [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' },
      ];
    }
    return q;
  });
}

function parseOneWord(text) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Format: "1. Question text - Answer" or "1. Question text? - Answer"
    const m = line.match(/^\d+[.)]\s+(.+?)\s*[-–—]\s*(.+)$/);
    if (m) {
      questions.push({
        id: uuidv4(),
        type: 'one-word',
        question: m[1].trim(),
        answer: m[2].trim(),
      });
    }
  }
  return questions;
}

function parseMatch(text) {
  // Qwen format: "A. Term - 1. Definition" or "A. Term1 - Term2 - 1. Definition"
  const pairs = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Match: "A. SomeTerm - 1. Some definition text"
    const m = line.match(/^([A-E])\.\s+(.+?)\s*[-–—]\s*\d+\.\s+(.+)$/);
    if (m) {
      pairs.push({
        key: m[1],
        term: m[2].trim(),
        definition: m[3].trim(),
      });
    }
  }

  if (pairs.length === 0) return [];

  // Shuffle definitions for the matching challenge
  const shuffled = [...pairs].sort(() => Math.random() - 0.5);

  return [{
    id: uuidv4(),
    type: 'match',
    pairs,          // original ordered pairs
    left: pairs.map(p => ({ key: p.key, text: p.term })),
    right: shuffled.map((p, i) => ({ key: String(i + 1), text: p.definition, matchKey: p.key })),
    answer: pairs.reduce((acc, p, i) => {
      const rightItem = shuffled.find(s => s.key === p.key);
      const rightIdx = shuffled.indexOf(rightItem);
      acc[p.key] = String(rightIdx + 1);
      return acc;
    }, {}),
  }];
}

function buildPrompt(type, topic) {
  if (type === 'mcq') {
    return `Generate exactly 5 multiple choice questions about "${topic}".
For each question use this exact format:
1. [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [A/B/C/D]

Generate all 5 questions now:`;
  }
  if (type === 'one-word') {
    return `Generate exactly 5 one-word or short-answer questions about "${topic}".
Use this exact format for each:
1. [Question] - [Answer]
2. [Question] - [Answer]
3. [Question] - [Answer]
4. [Question] - [Answer]
5. [Question] - [Answer]

Generate all 5 now:`;
  }
  // match
  return `Generate 5 match-the-following pairs about "${topic}".
Use this exact format:
A. [Term] - 1. [Definition]
B. [Term] - 2. [Definition]
C. [Term] - 3. [Definition]
D. [Term] - 4. [Definition]
E. [Term] - 5. [Definition]

Generate all 5 pairs now:`;
}

function ensureMinQuestions(questions, type, topic, count = 5) {
  while (questions.length < count) {
    const i = questions.length + 1;
    if (type === 'mcq') {
      questions.push({
        id: uuidv4(), type: 'mcq',
        question: `Question ${i} about ${topic}`,
        options: [
          { label: 'A', text: 'Option A' }, { label: 'B', text: 'Option B' },
          { label: 'C', text: 'Option C' }, { label: 'D', text: 'Option D' },
        ],
        answer: 'A',
      });
    } else if (type === 'one-word') {
      questions.push({ id: uuidv4(), type: 'one-word', question: `Question ${i} about ${topic}`, answer: 'Answer' });
    }
  }
  return questions;
}

router.post('/', async (req, res) => {
  const { topic, type } = req.body;
  if (!topic || !['mcq', 'one-word', 'match'].includes(type)) {
    return res.status(400).json({ error: 'topic and type (mcq|one-word|match) are required' });
  }

  try {
    const prompt = buildPrompt(type, topic);
    const aiText = await callMistral(prompt);

    let questions = [];
    if (type === 'mcq')      questions = parseMCQ(aiText, topic);
    else if (type === 'one-word') questions = parseOneWord(aiText);
    else if (type === 'match')    questions = parseMatch(aiText);

    // Ensure minimum 5 questions for mcq/one-word
    if (type !== 'match') questions = ensureMinQuestions(questions, type, topic);

    const quizId = uuidv4();
    quizCache[quizId] = { questions, topic, type };

    res.json({ quizId, questions, topic, type });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Quiz generation service unavailable. Please try again.' });
  }
});

router.post('/submit', (req, res) => {
  const { quizId, answers } = req.body;
  const quiz = quizCache[quizId];
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  let correct = 0;

  const results = quiz.questions.map(q => {
    if (q.type === 'match') {
      // For match, answers is { [leftKey]: rightKey }
      const matchCorrect = Object.entries(q.answer || {}).every(
        ([lk, rk]) => String(answers[lk] || '').trim() === String(rk).trim()
      );
      if (matchCorrect) correct++;
      return { questionId: q.id, type: 'match', isCorrect: matchCorrect, correctAnswer: q.answer };
    }
    const userAnswer = String(answers[q.id] || '').trim().toUpperCase();
    const correctAnswer = String(q.answer || '').trim().toUpperCase();
    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) correct++;
    return { questionId: q.id, question: q.question, userAnswer, correctAnswer: q.answer, isCorrect };
  });

  const score = Math.round((correct / quiz.questions.length) * 100);

  store.quizResults.push({
    id: uuidv4(),
    userId: req.userId,
    topic: quiz.topic,
    score,
    totalQuestions: quiz.questions.length,
    timestamp: new Date().toISOString(),
  });

  res.json({ score, correct, total: quiz.questions.length, results });
});

export default router;
