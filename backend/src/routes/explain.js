import { Router } from 'express';
import { callMistral } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { topic, level = 'beginner' } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const levelDesc = level === 'beginner' ? 'a complete beginner with no prior knowledge'
      : level === 'intermediate' ? 'someone with basic knowledge'
      : 'an advanced student';

    const prompt = `Explain "${topic}" to ${levelDesc}.

Structure your explanation as:
1. Simple Definition (1-2 sentences)
2. Why It Matters (1-2 sentences)
3. How It Works (3-4 bullet points)
4. Real-World Example (1 concrete example)
5. Key Points to Remember (3 bullet points)

Be clear, engaging, and use simple language with analogies where helpful.`;

    const explanation = await callMistral(prompt);
    res.json({ explanation, topic, level });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Explanation generation failed. Please try again.' });
  }
});

export default router;
