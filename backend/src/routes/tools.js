import { Router } from 'express';
import { callMistral } from '../services/hf.js';

const router = Router();

// ── Risk Scoring ──────────────────────────────────────────────
router.post('/risk-score', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const prompt = `You are a Content Risk Assessment Agent. Analyze the following content and provide a risk score.

Content:
${content.slice(0, 1500)}

Evaluate these risk factors:
1. Legal risk (claims, guarantees, liability)
2. Brand risk (tone, professionalism)
3. Compliance risk (sensitive words, exaggerations)
4. Ethical risk (bias, misinformation)

Output EXACTLY in this format:
Overall Risk: LOW or MEDIUM or HIGH
Risk Score: [number 0-100]

Legal Risk: LOW or MEDIUM or HIGH
Legal Notes: [brief explanation]

Brand Risk: LOW or MEDIUM or HIGH
Brand Notes: [brief explanation]

Compliance Risk: LOW or MEDIUM or HIGH
Compliance Notes: [brief explanation]

Ethical Risk: LOW or MEDIUM or HIGH
Ethical Notes: [brief explanation]

Flagged Phrases:
- [phrase 1 or "None"]
- [phrase 2]

Recommendations:
- [recommendation 1]
- [recommendation 2]`;

  try {
    const result = await callMistral(prompt);
    const scoreMatch = result.match(/Risk Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    const levelMatch = result.match(/Overall Risk:\s*(LOW|MEDIUM|HIGH)/i);
    const level = levelMatch ? levelMatch[1].toUpperCase() : 'MEDIUM';
    res.json({ result, score, level });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Risk scoring failed. Please try again.' });
  }
});

// ── A/B Testing ───────────────────────────────────────────────
router.post('/ab-test', async (req, res) => {
  const { content, platform } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const prompt = `You are an A/B Content Testing Agent. Generate two distinct versions of the following content optimized for ${platform || 'LinkedIn'}.

Original Content:
${content.slice(0, 1000)}

Generate two versions that differ in:
- Hook/opening style
- Tone (one more formal, one more engaging)
- Call-to-action approach

Output EXACTLY in this format:

VERSION A (Professional/Formal):
[Full version A content]

VERSION B (Engaging/Conversational):
[Full version B content]

Predicted Performance:
Version A: [predicted engagement level and why]
Version B: [predicted engagement level and why]
Recommendation: [which version to use and why]`;

  try {
    const result = await callMistral(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'A/B test generation failed.' });
  }
});

// ── Tone Customization ────────────────────────────────────────
router.post('/tone', async (req, res) => {
  const { content, tone, audience } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const prompt = `You are a Tone Customization Agent. Rewrite the following content in a ${tone || 'professional'} tone for a ${audience || 'general'} audience.

Original Content:
${content.slice(0, 1200)}

Tone: ${tone || 'professional'}
Target Audience: ${audience || 'general business professionals'}

Rules:
- Maintain the core message and key information
- Adapt vocabulary, sentence structure, and style to match the tone
- Keep the same length approximately

Output EXACTLY in this format:
Tone Applied: ${tone || 'professional'}
Target Audience: ${audience || 'general'}

Rewritten Content:
[Full rewritten content here]

Changes Made:
- [change 1]
- [change 2]
- [change 3]`;

  try {
    const result = await callMistral(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Tone customization failed.' });
  }
});

// ── Best Time to Publish ──────────────────────────────────────
router.post('/publish-time', async (req, res) => {
  const { contentType, industry, targetAudience } = req.body;

  const prompt = `You are a Content Publishing Strategy Agent. Recommend the best times to publish content.

Content Type: ${contentType || 'LinkedIn Post'}
Industry: ${industry || 'Technology'}
Target Audience: ${targetAudience || 'Business professionals'}

Based on engagement data patterns, provide publishing recommendations.

Output EXACTLY in this format:
Best Platform: ${contentType || 'LinkedIn'}

Top Publishing Windows:
1. [Day] at [Time] - [Reason]
2. [Day] at [Time] - [Reason]
3. [Day] at [Time] - [Reason]

Avoid These Times:
- [time/day to avoid and why]
- [time/day to avoid and why]

Audience Behavior Insights:
- [insight 1]
- [insight 2]
- [insight 3]

Expected Engagement Boost: [percentage range]%`;

  try {
    const result = await callMistral(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Publish time prediction failed.' });
  }
});

// ── Performance Prediction ────────────────────────────────────
router.post('/predict', async (req, res) => {
  const { content, platform } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const prompt = `You are a Content Performance Prediction Agent. Analyze this content and predict its performance on ${platform || 'LinkedIn'}.

Content:
${content.slice(0, 1200)}
Platform: ${platform || 'LinkedIn'}

Analyze: hook strength, readability, emotional appeal, call-to-action, keyword relevance, length optimization.

Output EXACTLY in this format:
Predicted Performance: POOR or AVERAGE or GOOD or EXCELLENT
Confidence: [percentage]%

Scores (out of 10):
Hook Strength: [score]/10
Readability: [score]/10
Emotional Appeal: [score]/10
Call-to-Action: [score]/10
Keyword Relevance: [score]/10

Predicted Metrics:
Estimated Reach: [range]
Estimated Engagement Rate: [percentage]%
Estimated Clicks: [range]

Strengths:
- [strength 1]
- [strength 2]

Improvements:
- [improvement 1]
- [improvement 2]`;

  try {
    const result = await callMistral(prompt);
    const perfMatch = result.match(/Predicted Performance:\s*(POOR|AVERAGE|GOOD|EXCELLENT)/i);
    const performance = perfMatch ? perfMatch[1].toUpperCase() : 'AVERAGE';
    res.json({ result, performance });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Performance prediction failed.' });
  }
});

export default router;
