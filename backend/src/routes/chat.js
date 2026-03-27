import { Router } from 'express';
import { store } from '../store.js';
import { callMistral } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  if (!store.chatHistories[req.userId]) store.chatHistories[req.userId] = [];
  const history = store.chatHistories[req.userId];

  history.push({ role: 'user', content: message });

  try {
    // Build Mistral instruction prompt with history
    const contextLines = history.slice(-10).map(m =>
      m.role === 'user' ? `[INST] ${m.content} [/INST]` : m.content
    ).join('\n');

    const prompt = `<s>You are the AgentFlow AI Assistant — an expert on the AgentFlow platform and general content strategy.

ABOUT AGENTFLOW (this is the platform you are embedded in):
AgentFlow is a Multi-Agent AI Content Pipeline platform that automates the entire content lifecycle from raw input to published, analytics-tracked content.

The platform has 7 AI agents that run sequentially:
1. Input Agent — Cleans and structures raw content (text or uploaded files: PDF, DOCX, TXT, images, Excel)
2. Content Generation Agent — Generates 4 formats: Blog Post, LinkedIn Post, Email Campaign, Product Description
3. Compliance Agent — Checks tone, grammar, sensitive words (like "guaranteed", "100% safe"), legal/ethical risks. Gives APPROVED or REJECTED status
4. Human-in-the-Loop — User can Approve ✅, Reject ❌, or Edit ✏️ the content before it moves forward
5. Localization Agent — Translates and culturally adapts content to Kannada and Hindi
6. Distribution Agent — Formats content for LinkedIn (with hashtags), Email (with subject line), and Blog
7. Analytics Agent — Analyzes engagement data (likes, clicks, shares) and suggests improvements

Additional AI Tools available:
- Risk Scoring System — rates content LOW/MEDIUM/HIGH risk with a 0-100 score
- A/B Testing — generates two content versions for comparison
- Tone Customization — rewrites content in professional, casual, technical, persuasive, or inspirational tone
- Best Time to Publish — predicts optimal publishing windows by platform and industry
- Performance Prediction — predicts engagement before publishing (hook, readability, CTA scores)

Key concepts: Multi-agent pipeline, Human-in-the-loop approval, Compliance guardrails, End-to-end automation, Audit trail, Content lifecycle automation

RESPONSE GUIDELINES:
- Always respond in clear, well-formatted markdown
- Use bullet points for lists
- Use bold for important terms
- Keep responses concise and actionable
- If asked about AgentFlow features, explain them accurately based on the info above
- You can also help with general content writing, marketing strategy, SEO, and AI topics

${contextLines}`;
    const aiText = await callMistral(prompt);

    // Extract only the new response (after last [/INST])
    const parts = aiText.split('[/INST]');
    const response = parts[parts.length - 1].trim() || aiText.trim();

    history.push({ role: 'assistant', content: response });

    res.json({ response, history: [...history] });
  } catch (err) {
    console.error(err);
    history.pop(); // Remove failed user message from history
    res.status(502).json({ error: 'AI tutor is temporarily unavailable. Please try again.' });
  }
});

router.get('/history', (req, res) => {
  res.json({ history: store.chatHistories[req.userId] || [] });
});

router.delete('/history', (req, res) => {
  store.chatHistories[req.userId] = [];
  res.json({ message: 'Chat history cleared' });
});

export default router;
