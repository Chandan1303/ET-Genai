import { Router } from 'express';
import { callMistral } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { topic, count = 10 } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const prompt = `Create exactly ${count} flashcards about "${topic}".
Use this exact format for each flashcard:
Q: [question]
A: [answer]

Make questions clear and answers concise. Generate all ${count} flashcards now:`;

    const aiText = await callMistral(prompt);
    const cards = parseFlashcards(aiText);

    // Ensure minimum cards
    if (cards.length < 3) {
      return res.status(502).json({ error: 'Could not generate flashcards. Please try again.' });
    }

    res.json({ flashcards: cards, topic, count: cards.length });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Flashcard generation failed. Please try again.' });
  }
});

function parseFlashcards(text) {
  const cards = [];
  const lines = text.split('\n');
  let currentQ = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const qMatch = trimmed.match(/^Q[:\s]+(.+)/i);
    const aMatch = trimmed.match(/^A[:\s]+(.+)/i);
    if (qMatch) { currentQ = qMatch[1].trim(); }
    else if (aMatch && currentQ) {
      cards.push({ id: cards.length + 1, question: currentQ, answer: aMatch[1].trim() });
      currentQ = null;
    }
  }
  return cards;
}

export default router;
