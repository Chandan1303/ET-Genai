import { Router } from 'express';
import multer from 'multer';
import { callMistral, callMistralLong } from '../services/hf.js';
import { store } from '../store.js';
import { v4 as uuidv4 } from 'uuid';
import { extractText } from '../services/fileExtractor.js';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

// ── AGENT 1b: Input Agent via File Upload ────────────────────────────
router.post('/input-file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = await extractText(req.file);
  if (!text) return res.status(422).json({ error: 'Could not extract text from this file. Supported: PDF, DOCX, TXT, PNG/JPG, XLSX/CSV' });
  if (text.length < 30) return res.status(422).json({ error: 'File content too short to process' });

  const prompt = `You are an Input Processing Agent. Clean and structure the following raw content extracted from a document.

Raw Content:
${text.slice(0, 3000)}

Output EXACTLY in this format (no extra text):
Title: [extracted title]
Key Topics: [comma-separated topics]
Summary: [5-6 line summary]
Important Points:
- [point 1]
- [point 2]
- [point 3]
- [point 4]
- [point 5]`;

  try {
    const result = await callMistral(prompt);
    const sessionId = uuidv4();
    if (!store.agentSessions) store.agentSessions = [];
    store.agentSessions.push({
      id: sessionId, userId: req.userId,
      createdAt: new Date().toISOString(),
      rawText: text.slice(0, 500),
      inputResult: result, stage: 'input',
    });
    res.json({ sessionId, result, rawText: text.slice(0, 300) });
  } catch (err) {
    console.error('Input agent error:', err.message);
    const msg = err.message?.includes('401') || err.message?.includes('403')
      ? 'Invalid API key. Check your HF_API_KEY in .env'
      : err.message?.includes('429')
      ? 'Rate limit reached. Please wait a moment and try again.'
      : err.message?.includes('503')
      ? 'AI model is loading. Please try again in 20 seconds.'
      : 'Input agent failed. Please try again.';
    res.status(502).json({ error: msg });
  }
});

// ── AGENT 1: Input Agent ──────────────────────────────────────────────
router.post('/input', async (req, res) => {
  const { rawText } = req.body;
  if (!rawText?.trim()) return res.status(400).json({ error: 'rawText is required' });

  const prompt = `You are an Input Processing Agent. Clean and structure the following raw content.

Raw Content:
${rawText}

Output EXACTLY in this format (no extra text):
Title: [extracted title]
Key Topics: [comma-separated topics]
Summary: [5-6 line summary]
Important Points:
- [point 1]
- [point 2]
- [point 3]
- [point 4]
- [point 5]`;

  try {
    const result = await callMistral(prompt);
    const sessionId = uuidv4();

    // Store in session
    if (!store.agentSessions) store.agentSessions = [];
    store.agentSessions.push({
      id: sessionId,
      userId: req.userId,
      createdAt: new Date().toISOString(),
      rawText,
      inputResult: result,
      stage: 'input',
    });

    res.json({ sessionId, result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Input agent failed. Please try again.' });
  }
});

// ── AGENT 2: Content Generation Agent ────────────────────────────────
router.post('/content', async (req, res) => {
  const { sessionId, structuredContent } = req.body;
  if (!structuredContent?.trim()) return res.status(400).json({ error: 'structuredContent is required' });

  const prompt = `You are a Content Generation Agent. Convert the structured input into multiple content formats.

Structured Input:
${structuredContent}

Generate ALL of the following (label each section clearly):

BLOG POST:
[Write a professional, detailed blog post of 300-400 words]

LINKEDIN POST:
[Write an engaging LinkedIn post with a hook, max 150 words, add 3-5 relevant hashtags]

EMAIL CAMPAIGN:
[Write a formal and persuasive email with Subject line, body, and call-to-action]

PRODUCT DESCRIPTION:
[Write a clear and attractive product/service description, 100-150 words]`;

  try {
    const result = await callMistralLong(prompt);

    // Update session
    if (sessionId && store.agentSessions) {
      const session = store.agentSessions.find(s => s.id === sessionId && s.userId === req.userId);
      if (session) { session.contentResult = result; session.stage = 'content'; }
    }

    res.json({ sessionId, result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Content agent failed. Please try again.' });
  }
});

// ── AGENT 3: Compliance Agent ─────────────────────────────────────────
router.post('/compliance', async (req, res) => {
  const { sessionId, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const prompt = `You are a Compliance and Brand Governance Agent. Review the following content strictly.

Content to Review:
${content}

Check for:
1. Tone issues (too informal, too exaggerated, unprofessional)
2. Grammar mistakes
3. Sensitive or risky words (e.g., "guaranteed", "100% safe", "best ever")
4. Legal or ethical risks

Output EXACTLY in this format:
Issues Found:
- [issue 1 or "None"]
- [issue 2]

Suggestions:
- [suggestion 1 or "None"]
- [suggestion 2]

Final Status: APPROVED or REJECTED`;

  try {
    const result = await callMistral(prompt);
    const approved = result.toUpperCase().includes('FINAL STATUS: APPROVED') ||
      (result.toUpperCase().includes('APPROVED') && !result.toUpperCase().includes('REJECTED'));

    if (sessionId && store.agentSessions) {
      const session = store.agentSessions.find(s => s.id === sessionId && s.userId === req.userId);
      if (session) { session.complianceResult = result; session.complianceStatus = approved ? 'approved' : 'rejected'; session.stage = 'compliance'; }
    }

    res.json({ sessionId, result, approved });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Compliance agent failed. Please try again.' });
  }
});

// ── AGENT 4: Localization Agent ───────────────────────────────────────
router.post('/localize', async (req, res) => {
  const { sessionId, content, languages = ['Kannada', 'Hindi'] } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const langList = Array.isArray(languages) ? languages : ['Kannada', 'Hindi'];
  // Trim content more aggressively when multiple languages are selected to stay within token budget
  const maxContentLen = langList.length > 2 ? 600 : langList.length === 2 ? 900 : 1500;
  const outputSections = langList.map(lang => `${lang} Version:\n[Write the complete ${lang} translation here — do not skip or truncate]`).join('\n\n');

  const prompt = `You are a Localization Agent. You MUST translate the content into ALL ${langList.length} language(s) listed below. Do not stop after the first language.

Content:
${content.slice(0, maxContentLen)}

Target Languages (translate into EVERY one): ${langList.join(', ')}

Instructions:
- Translate into EACH language separately — all ${langList.length} version(s) are required
- Do NOT do word-to-word translation
- Maintain cultural relevance for each language/region
- Keep tone natural and fluent
- Preserve the original meaning

Output EXACTLY in this format — include ALL ${langList.length} language section(s):

${outputSections}`;

  try {
    const result = await callMistralLong(prompt);
    if (sessionId && store.agentSessions) {
      const session = store.agentSessions.find(s => s.id === sessionId && s.userId === req.userId);
      if (session) { session.localizationResult = result; session.stage = 'localization'; }
    }
    res.json({ sessionId, result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Localization agent failed. Please try again.' });
  }
});

// ── AGENT 5: Distribution Agent ───────────────────────────────────────
router.post('/distribute', async (req, res) => {
  const { sessionId, content, platforms = ['LinkedIn', 'Email', 'Blog'] } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const platformList = Array.isArray(platforms) ? platforms : ['LinkedIn', 'Email', 'Blog'];

  const platformFormats = {
    LinkedIn: `LinkedIn Post:\n[Formatted LinkedIn post with a strong hook, max 200 words, and 3-5 relevant hashtags]`,
    Email: `Email Format:\nSubject: [compelling subject line]\nBody: [formal, persuasive email body with greeting, value proposition, and call-to-action]`,
    Blog: `Blog Format:\nTitle: [SEO-friendly blog title]\n[Full blog post with introduction, 2-3 sections with subheadings, and conclusion]`,
    Twitter: `Twitter Post:\n[Engaging tweet max 280 characters with 2-3 hashtags]`,
    Instagram: `Instagram Caption:\n[Engaging caption with emojis, storytelling hook, and 5-8 hashtags]`,
  };

  const outputSections = platformList.map(p => platformFormats[p] || `${p} Format:\n[Formatted content for ${p}]`).join('\n\n');

  const prompt = `You are a Distribution Agent. Format the following content for the specified publishing platforms.

Content:
${content.slice(0, 1500)}

Target Platforms: ${platformList.join(', ')}

Output EXACTLY in this format (include ONLY the requested platforms):

${outputSections}`;

  try {
    const result = await callMistral(prompt);
    if (sessionId && store.agentSessions) {
      const session = store.agentSessions.find(s => s.id === sessionId && s.userId === req.userId);
      if (session) { session.distributionResult = result; session.stage = 'distribution'; }
    }
    res.json({ sessionId, result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Distribution agent failed. Please try again.' });
  }
});

// ── AGENT 6: Analytics Agent ──────────────────────────────────────────
router.post('/analytics', async (req, res) => {
  const { sessionId, engagementData } = req.body;

  const prompt = `You are an Analytics Agent. Analyze the following content engagement data.

Engagement Data:
${JSON.stringify(engagementData || { likes: 0, clicks: 0, shares: 0 })}

Output EXACTLY in this format:
Best Performing Content: [which format performed best and why]

Insights:
- [insight 1]
- [insight 2]
- [insight 3]

Suggestions:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]`;

  try {
    const result = await callMistral(prompt);

    if (sessionId && store.agentSessions) {
      const session = store.agentSessions.find(s => s.id === sessionId && s.userId === req.userId);
      if (session) { session.analyticsResult = result; session.stage = 'complete'; }
    }

    res.json({ sessionId, result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Analytics agent failed. Please try again.' });
  }
});

// ── Get session history ───────────────────────────────────────────────
router.get('/sessions', (req, res) => {
  if (!store.agentSessions) store.agentSessions = [];
  const sessions = store.agentSessions
    .filter(s => s.userId === req.userId)
    .map(s => ({ id: s.id, createdAt: s.createdAt, stage: s.stage, title: s.inputResult?.split('\n')[0]?.replace('Title:', '').trim() || 'Untitled' }))
    .reverse()
    .slice(0, 20);
  res.json({ sessions });
});

router.get('/sessions/:id', (req, res) => {
  if (!store.agentSessions) return res.json({ session: null });
  const session = store.agentSessions.find(s => s.id === req.params.id && s.userId === req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

export default router;
