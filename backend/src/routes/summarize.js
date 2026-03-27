import { Router } from 'express';
import { callBART } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long.' });
  }

  try {
    const summary = await callBART(text);
    // Format as bullet points
    const bullets = summary
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .map(s => `• ${s}`);

    res.json({ summary: bullets.length ? bullets : [`• ${summary}`] });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Summarization service unavailable. Please try again.' });
  }
});

export default router;
