import { Router } from 'express';
import { store } from '../store.js';
import { callMistral } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const results = store.quizResults.filter(r => r.userId === req.userId);
  if (results.length === 0) {
    return res.status(422).json({ error: 'Please complete at least one quiz before running weak topic analysis.' });
  }

  try {
    const summary = results.map(r => `${r.topic}: ${r.score}%`).join(', ');
    const prompt = `<s>[INST] Analyze this student's quiz performance: ${summary}.
Identify weak topics (below 60%), moderate topics (60-80%), and strong topics (above 80%).
For each weak topic, suggest 2-3 specific improvement strategies.
Format your response as:
WEAK: [topics]
MODERATE: [topics]  
STRONG: [topics]
IMPROVEMENTS: [specific suggestions for weak topics] [/INST]`;

    const aiText = await callMistral(prompt);

    // Parse response
    const weakMatch = aiText.match(/WEAK:\s*([^\n]+)/i);
    const moderateMatch = aiText.match(/MODERATE:\s*([^\n]+)/i);
    const strongMatch = aiText.match(/STRONG:\s*([^\n]+)/i);
    const improvMatch = aiText.match(/IMPROVEMENTS:\s*([\s\S]+)/i);

    const parseList = (m) => m ? m[1].split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];

    // Fallback: classify by score
    const weak = results.filter(r => r.score < 60).map(r => r.topic);
    const moderate = results.filter(r => r.score >= 60 && r.score < 80).map(r => r.topic);
    const strong = results.filter(r => r.score >= 80).map(r => r.topic);

    res.json({
      weak: parseList(weakMatch).length ? parseList(weakMatch) : weak,
      moderate: parseList(moderateMatch).length ? parseList(moderateMatch) : moderate,
      strong: parseList(strongMatch).length ? parseList(strongMatch) : strong,
      improvements: improvMatch ? improvMatch[1].trim() : 'Focus on reviewing weak topics daily and practice more quizzes.',
      rawAnalysis: aiText,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Weak topic analysis service unavailable. Please try again.' });
  }
});

export default router;
