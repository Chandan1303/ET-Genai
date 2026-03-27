# AgentFlow — Multi-Agent AI Content Pipeline

> End-to-end content lifecycle automation powered by a 7-agent AI orchestration system with human-in-the-loop control, compliance guardrails, localization, and analytics.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [The 7-Agent Pipeline](#the-7-agent-pipeline)
- [AI Models Used](#ai-models-used)
- [Additional AI Tools](#additional-ai-tools)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

**AgentFlow** is a full-stack web application that automates the entire content creation lifecycle using a multi-agent AI pipeline. Instead of a single monolithic AI call, AgentFlow breaks content processing into 7 specialized agents — each with a focused responsibility — orchestrated sequentially with a human approval checkpoint.

### What problem does it solve?

Traditional content creation is slow, inconsistent, and error-prone. AgentFlow automates:
- Cleaning and structuring raw input (text or uploaded files)
- Generating multiple content formats simultaneously
- Checking compliance, tone, and legal risks automatically
- Translating content for regional audiences
- Formatting for specific publishing platforms
- Tracking and analyzing engagement performance

### Key Concepts Demonstrated

| Concept | Implementation |
|---|---|
| Multi-agent pipeline | 7 sequential AI agents with defined roles |
| Human-in-the-loop | Approve / Reject / Edit before pipeline continues |
| Compliance guardrails | Automated tone, grammar, and legal risk checks |
| End-to-end automation | Input → Published-ready content in one flow |
| Audit trail | Timestamped log of every agent action |
| Content lifecycle automation | From raw text to analytics in a single session |

---

## Architecture

```
User Input (Text / File Upload)
        │
        ▼
┌─────────────────┐
│  Input Agent    │  ← Cleans, structures, extracts key topics
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Content Generation  │  ← Blog + LinkedIn + Email + Product Desc
└────────┬────────────┘
         │
         ▼
┌──────────────────┐
│ Compliance Agent │  ← Tone, grammar, risky words, legal risks
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Human-in-the-Loop    │  ← Approve ✓ / Reject ✗ / Edit ✏️
└────────┬─────────────┘
         │ (only if approved)
         ▼
┌──────────────────────┐
│ Localization Agent   │  ← Kannada + Hindi cultural adaptation
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Distribution Agent   │  ← LinkedIn (hashtags) + Email (subject) + Blog
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│ Analytics Agent  │  ← Engagement analysis + improvement suggestions
└──────────────────┘
```

Each agent runs as a separate API endpoint. The frontend orchestrates the flow, passing session IDs between stages. All agent outputs are stored in an in-memory session store with a full audit trail.

---

## The 7-Agent Pipeline

### Agent 1 — Input Agent
**Route:** `POST /api/ai/agents/input` | `POST /api/ai/agents/input-file`

**Purpose:** Cleans and structures raw content from any source.

**Accepts:**
- Plain text (paste)
- File uploads: PDF, DOCX, TXT, PNG/JPG (OCR), XLSX/CSV

**Output format:**
```
Title: [extracted title]
Key Topics: [comma-separated]
Summary: [5-6 lines]
Important Points:
- [bullet points]
```

**Why it matters:** Raw content from documents is noisy. This agent removes irrelevant text, identifies structure, and produces a clean input for downstream agents.

---

### Agent 2 — Content Generation Agent
**Route:** `POST /api/ai/agents/content`

**Purpose:** Converts structured input into 4 content formats simultaneously.

**Generates:**
1. **Blog Post** — Professional, 300–500 words, SEO-friendly
2. **LinkedIn Post** — Engaging hook, short, with hashtags
3. **Email Campaign** — Formal, persuasive, with subject line and CTA
4. **Product Description** — Clear, attractive, audience-specific

**Why it matters:** Manually writing 4 formats for every piece of content is time-consuming. This agent does it in one shot while maintaining consistency.

---

### Agent 3 — Compliance Agent
**Route:** `POST /api/ai/agents/compliance`

**Purpose:** Reviews generated content for risks before it reaches humans.

**Checks:**
- Tone issues (too informal, exaggerated, unprofessional)
- Grammar mistakes
- Sensitive/risky words: "guaranteed", "100% safe", "best ever"
- Legal and ethical risks

**Output:**
```
Issues Found: [list]
Suggestions: [corrected versions]
Final Status: APPROVED or REJECTED
```

**Why it matters:** Compliance failures can cause legal issues and brand damage. Automated pre-screening catches problems before human review.

---

### Agent 4 — Human-in-the-Loop
**Route:** Frontend UI only (no AI call)

**Purpose:** Gives humans control before content moves forward.

**Actions:**
- **Approve** — Content proceeds to localization
- **Reject** — Returns to content generation for revision
- **Edit** — Inline text editor to modify content before approving

**Why it matters:** AI is not perfect. Human oversight ensures quality and accountability. This is the "guardrail" that prevents bad content from being published.

---

### Agent 5 — Localization Agent
**Route:** `POST /api/ai/agents/localize`

**Purpose:** Translates and culturally adapts content for regional audiences.

**Languages:**
- **Kannada** — Cultural adaptation for Karnataka audience
- **Hindi** — Cultural adaptation for Hindi-speaking audience

**Rules applied:**
- No word-for-word translation
- Maintain cultural relevance and natural tone
- Preserve original meaning

**Why it matters:** India has 22 official languages. Localized content performs significantly better with regional audiences than direct translations.

---

### Agent 6 — Distribution Agent
**Route:** `POST /api/ai/agents/distribute`

**Purpose:** Formats content for specific publishing platforms.

**Platforms:**
- **LinkedIn** — Formatted post with relevant hashtags
- **Email** — Subject line + body + call-to-action
- **Blog** — Title + structured sections + SEO formatting

**Why it matters:** Each platform has different formatting requirements, character limits, and audience expectations. One-size-fits-all content underperforms.

---

### Agent 7 — Analytics Agent
**Route:** `POST /api/ai/agents/analytics`

**Purpose:** Analyzes engagement data and generates improvement insights.

**Input:** Likes, Clicks, Shares

**Output:**
```
Best Performing Content: [which format and why]
Insights: [patterns identified]
Suggestions: [actionable improvements]
```

**Why it matters:** Without analytics, content teams repeat the same mistakes. This agent closes the feedback loop.

---

## AI Models Used

### Quick Reference Table

| Model | API / Provider | Purpose | Used In |
|---|---|---|---|
| `Qwen/Qwen2.5-7B-Instruct-Turbo` | Hugging Face Router → Together AI | All text generation, instruction following | All 7 pipeline agents, AI Tools, Chatbot |
| `facebook/bart-large-cnn` | Hugging Face Inference API | Document summarization | File upload summarization |
| `pdfjs-dist` | Local (no API) | PDF text extraction | Input Agent file upload |
| `mammoth` | Local (no API) | DOCX/Word text extraction | Input Agent file upload |
| `tesseract.js` | Local (no API) | OCR — image to text (PNG/JPG) | Input Agent file upload |
| `xlsx` | Local (no API) | Excel/CSV parsing | Input Agent file upload |

---

### API Endpoints Used

| API | Base URL | Auth | Used For |
|---|---|---|---|
| Hugging Face Router (Together) | `https://router.huggingface.co/together/v1/chat/completions` | `Bearer HF_API_KEY` | All LLM text generation |
| Hugging Face Inference | `https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn` | `Bearer HF_API_KEY` | Summarization |

---

### Model 1: `Qwen/Qwen2.5-7B-Instruct-Turbo`

**API:** Hugging Face Router → Together AI provider

**Endpoint:** `https://router.huggingface.co/together/v1/chat/completions`

**Request format:**
```json
{
  "model": "Qwen/Qwen2.5-7B-Instruct-Turbo",
  "messages": [{ "role": "user", "content": "..." }],
  "max_tokens": 1024,
  "temperature": 0.7
}
```

**Used for every agent:**

| Agent / Feature | max_tokens | Why |
|---|---|---|
| Input Agent | 1024 | Structured extraction — short output |
| Content Generation Agent | 3000 | 4 formats simultaneously — needs more tokens |
| Compliance Agent | 1024 | Report format — moderate length |
| Localization Agent | 1024 | Translation of approved content |
| Distribution Agent | 1024 | Platform formatting |
| Analytics Agent | 1024 | Insights report |
| Risk Scoring Tool | 1024 | Risk report |
| A/B Testing Tool | 1024 | Two content versions |
| Tone Customization Tool | 1024 | Rewritten content |
| Publish Time Tool | 512 | Short schedule output |
| Performance Prediction Tool | 1024 | Scores and analysis |
| AI Assistant Chatbot | 1024 | Conversational responses |

**Why Qwen2.5-7B-Instruct-Turbo:**
- Excellent instruction-following — critical for structured output formats
- "Turbo" variant optimized for low-latency inference
- Strong multilingual support (Kannada, Hindi localization)
- 7B parameters — good quality/speed balance
- Available via Hugging Face Router without separate API keys

---

### Model 2: `facebook/bart-large-cnn`

**API:** Hugging Face Inference API

**Endpoint:** `https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn`

**Request format:**
```json
{
  "inputs": "long text to summarize..."
}
```

**Used for:** File upload summarization (when user uploads PDF/DOCX/image and selects "Summarize")

**Why BART-large-CNN:**
- Fine-tuned specifically on CNN/DailyMail summarization dataset
- Produces clean, abstractive summaries (not just extracting sentences)
- Faster than instruction-tuned LLMs for this specific task
- Consistent output quality for document summarization

---

## AI Tools — Detailed Reference

All 5 AI Tools use **`Qwen/Qwen2.5-7B-Instruct-Turbo`** via the Hugging Face Router API (Together AI provider). They are standalone tools accessible from the `/tools` page, independent of the pipeline.

### Quick Reference

| Tool | Route | Model | max_tokens | Purpose |
|---|---|---|---|---|
| Risk Scoring | `POST /api/ai/tools/risk-score` | Qwen2.5-7B-Instruct-Turbo | 1024 | Analyze content for legal, brand, compliance, ethical risks |
| A/B Testing | `POST /api/ai/tools/ab-test` | Qwen2.5-7B-Instruct-Turbo | 1024 | Generate 2 content versions for comparison |
| Tone Customization | `POST /api/ai/tools/tone` | Qwen2.5-7B-Instruct-Turbo | 1024 | Rewrite content in a different tone/style |
| Best Time to Publish | `POST /api/ai/tools/publish-time` | Qwen2.5-7B-Instruct-Turbo | 512 | Predict optimal publishing windows |
| Performance Prediction | `POST /api/ai/tools/predict` | Qwen2.5-7B-Instruct-Turbo | 1024 | Score content before publishing |

---

### Tool 1 — Risk Scoring System

**Route:** `POST /api/ai/tools/risk-score`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo`
**Input:** `{ content: string }`

**What it does:**
Analyzes content across 4 risk dimensions and returns a 0–100 risk score with a LOW / MEDIUM / HIGH classification.

**Risk dimensions checked:**
- **Legal risk** — claims, guarantees, liability statements
- **Brand risk** — tone, professionalism, exaggeration
- **Compliance risk** — sensitive words like "guaranteed", "100% safe", "best ever"
- **Ethical risk** — bias, misinformation, misleading statements

**Output format:**
```
Overall Risk: LOW / MEDIUM / HIGH
Risk Score: 0-100

Legal Risk: LOW/MEDIUM/HIGH
Legal Notes: ...

Brand Risk: LOW/MEDIUM/HIGH
Brand Notes: ...

Compliance Risk: LOW/MEDIUM/HIGH
Compliance Notes: ...

Ethical Risk: LOW/MEDIUM/HIGH
Ethical Notes: ...

Flagged Phrases: [list]
Recommendations: [list]
```

**Why this model:** Qwen2.5 is excellent at structured analysis tasks and follows the exact output format required for parsing the risk score and level.

---

### Tool 2 — Auto A/B Testing

**Route:** `POST /api/ai/tools/ab-test`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo`
**Input:** `{ content: string, platform: string }`

**What it does:**
Generates two distinct versions of the same content — one formal/professional, one engaging/conversational — optimized for the selected platform (LinkedIn, Email, Blog, Twitter).

**Output format:**
```
VERSION A (Professional/Formal):
[Full version A]

VERSION B (Engaging/Conversational):
[Full version B]

Predicted Performance:
Version A: [prediction]
Version B: [prediction]
Recommendation: [which to use and why]
```

**Why useful:** A/B testing is standard practice in content marketing. This tool automates the creation of test variants and provides AI-predicted performance comparison before you spend time publishing.

---

### Tool 3 — Tone Customization

**Route:** `POST /api/ai/tools/tone`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo`
**Input:** `{ content: string, tone: string, audience: string }`

**Available tones:** Professional, Casual & Friendly, Technical, Persuasive, Inspirational, Formal

**Available audiences:** Business Professionals, Developers, Students, Executives, General Public

**What it does:**
Rewrites the content in the specified tone for the target audience while preserving the core message and key information.

**Output format:**
```
Tone Applied: [tone]
Target Audience: [audience]

Rewritten Content:
[full rewritten content]

Changes Made:
- [change 1]
- [change 2]
```

**Why useful:** The same content needs different tones for different audiences. A technical blog post needs to be rewritten as a casual LinkedIn post for a general audience.

---

### Tool 4 — Best Time to Publish

**Route:** `POST /api/ai/tools/publish-time`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo`
**Input:** `{ contentType: string, industry: string, targetAudience: string }`

**Content types:** LinkedIn Post, Blog Post, Email Campaign, Twitter Post

**Industries:** Technology, Finance, Healthcare, Education, Retail, Marketing

**What it does:**
Predicts the top 3 optimal publishing windows based on content type, industry, and audience behavior patterns.

**Output format:**
```
Best Platform: [platform]

Top Publishing Windows:
1. [Day] at [Time] - [Reason]
2. [Day] at [Time] - [Reason]
3. [Day] at [Time] - [Reason]

Avoid These Times:
- [time/day and why]

Audience Behavior Insights:
- [insight 1]
- [insight 2]

Expected Engagement Boost: [X-Y]%
```

**Why useful:** Publishing at the wrong time can reduce engagement by 50%+. This tool provides data-informed scheduling recommendations.

---

### Tool 5 — Performance Prediction

**Route:** `POST /api/ai/tools/predict`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo`
**Input:** `{ content: string, platform: string }`

**What it does:**
Scores content across 5 dimensions before publishing and predicts overall performance (POOR / AVERAGE / GOOD / EXCELLENT).

**Scoring dimensions (each out of 10):**
- **Hook Strength** — how compelling the opening is
- **Readability** — sentence structure, clarity, flow
- **Emotional Appeal** — connection with the audience
- **Call-to-Action** — clarity and persuasiveness of CTA
- **Keyword Relevance** — SEO and platform relevance

**Output format:**
```
Predicted Performance: POOR / AVERAGE / GOOD / EXCELLENT
Confidence: [X]%

Scores (out of 10):
Hook Strength: X/10
Readability: X/10
Emotional Appeal: X/10
Call-to-Action: X/10
Keyword Relevance: X/10

Predicted Metrics:
Estimated Reach: [range]
Estimated Engagement Rate: [X]%
Estimated Clicks: [range]

Strengths: [list]
Improvements: [list]
```

**Why useful:** Knowing predicted performance before publishing allows content teams to improve weak areas without wasting distribution budget on underperforming content.

---

### Risk Scoring System
**Route:** `POST /api/ai/tools/risk-score`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo` via Hugging Face Router (Together AI)

Analyzes content for legal, brand, compliance, and ethical risks. Returns a 0–100 risk score with LOW/MEDIUM/HIGH classification and flagged phrases.

### A/B Testing Generator
**Route:** `POST /api/ai/tools/ab-test`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo` via Hugging Face Router (Together AI)

Generates two distinct content versions (formal vs. conversational) for a chosen platform, with predicted performance comparison and recommendation.

### Tone Customization
**Route:** `POST /api/ai/tools/tone`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo` via Hugging Face Router (Together AI)

Rewrites content in a specified tone (professional, casual, technical, persuasive, inspirational, formal) for a target audience.

### Best Time to Publish
**Route:** `POST /api/ai/tools/publish-time`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo` via Hugging Face Router (Together AI)

Predicts optimal publishing windows based on content type, industry, and target audience. Returns top 3 time slots with reasoning.

### Performance Prediction
**Route:** `POST /api/ai/tools/predict`
**Model:** `Qwen/Qwen2.5-7B-Instruct-Turbo` via Hugging Face Router (Together AI)

Scores content before publishing on: Hook Strength, Readability, Emotional Appeal, Call-to-Action, and Keyword Relevance. Predicts reach and engagement rate.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| Vite | 8.0.1 | Build tool and dev server |
| React Router DOM | 7.13.2 | Client-side routing |
| Lucide React | 1.6.0 | Professional icon library |
| React Hot Toast | 2.6.0 | Toast notifications |
| Axios | 1.13.6 | HTTP client |
| CSS Variables | — | Theme system (dark/light mode) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22.x | Runtime |
| Express | 4.19.2 | HTTP server framework |
| Multer | 2.1.1 | File upload handling |
| JWT (jsonwebtoken) | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| UUID | 10.0.0 | Session ID generation |
| pdfjs-dist | 5.5.207 | PDF parsing |
| mammoth | 1.12.0 | DOCX parsing |
| tesseract.js | 7.0.0 | OCR for images |
| xlsx | 0.18.5 | Excel/CSV parsing |

### AI Infrastructure
| Service | Purpose |
|---|---|
| Hugging Face Router API | Unified API gateway for AI models |
| Together AI (via HF Router) | Hosts Qwen2.5-7B-Instruct-Turbo |
| HF Inference API | Hosts facebook/bart-large-cnn |

---

## Project Structure

```
agentflow/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry point
│   │   ├── store.js              # In-memory data store
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── agents.js         # All 7 pipeline agent endpoints
│   │   │   ├── tools.js          # AI Tools (risk, A/B, tone, timing, predict)
│   │   │   ├── chat.js           # AI Assistant chatbot
│   │   │   ├── auth.js           # Login/register endpoints
│   │   │   └── fileUpload.js     # File processing endpoints
│   │   └── services/
│   │       ├── hf.js             # Hugging Face API wrapper
│   │       └── fileExtractor.js  # PDF/DOCX/Image/Excel text extraction
│   ├── uploads/                  # Temporary file storage
│   ├── .env                      # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Routes configuration
    │   ├── main.jsx              # React entry point
    │   ├── index.css             # Global styles (Material Design 3)
    │   ├── api.js                # Axios instance with auth headers
    │   ├── components/
    │   │   ├── Layout.jsx        # Sidebar navigation layout
    │   │   ├── FloatingChat.jsx  # AI Assistant chat widget
    │   │   ├── MarkdownText.jsx  # Markdown renderer for AI responses
    │   │   └── Logo.jsx          # AgentFlow logo component
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Authentication state
    │   │   └── ThemeContext.jsx  # Dark/light mode state
    │   └── pages/
    │       ├── Landing.jsx       # Public landing page
    │       ├── Auth.jsx          # Login/register page
    │       ├── Dashboard.jsx     # Pipeline overview + recent runs
    │       ├── Pipeline.jsx      # Main 7-agent pipeline UI
    │       ├── Analytics.jsx     # Standalone analytics agent
    │       └── Tools.jsx         # AI Tools (risk, A/B, tone, etc.)
    ├── index.html
    └── package.json
```

---

## API Reference

### Authentication
```
POST /api/auth/register    { username, password }
POST /api/auth/login       { username, password }
```

### Pipeline Agents (all require Bearer token)
```
POST /api/ai/agents/input          { rawText }
POST /api/ai/agents/input-file     multipart/form-data (file)
POST /api/ai/agents/content        { sessionId, structuredContent }
POST /api/ai/agents/compliance     { sessionId, content }
POST /api/ai/agents/localize       { sessionId, content }
POST /api/ai/agents/distribute     { sessionId, content }
POST /api/ai/agents/analytics      { sessionId, engagementData }
GET  /api/ai/agents/sessions       (list recent sessions)
GET  /api/ai/agents/sessions/:id   (get session details)
```

### AI Tools
```
POST /api/ai/tools/risk-score      { content }
POST /api/ai/tools/ab-test         { content, platform }
POST /api/ai/tools/tone            { content, tone, audience }
POST /api/ai/tools/publish-time    { contentType, industry, targetAudience }
POST /api/ai/tools/predict         { content, platform }
```

### Chat
```
POST   /api/ai/chat                { message }
GET    /api/ai/chat/history
DELETE /api/ai/chat/history
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- A Hugging Face account with API key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/agentflow.git
cd agentflow
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure environment variables
```bash
cd ../backend
cp .env.example .env
# Edit .env and add your HF_API_KEY
```

### 5. Start the backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### 6. Start the frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

---

## Environment Variables

```env
# backend/.env

HF_API_KEY=hf_your_huggingface_api_key_here
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

**Getting a Hugging Face API key:**
1. Go to [huggingface.co](https://huggingface.co)
2. Create an account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token to `HF_API_KEY`

---

## Key Design Decisions

### Why a multi-agent architecture instead of one big prompt?

Single large prompts produce inconsistent results and are hard to debug. By splitting responsibilities:
- Each agent has a focused, well-defined task
- Failures are isolated and easier to diagnose
- Individual agents can be improved independently
- The pipeline is transparent — users see exactly what each agent does

### Why in-memory storage instead of a database?

For a demo/hackathon context, in-memory storage (`store.js`) eliminates setup complexity. The architecture is designed so that replacing the store with MongoDB or PostgreSQL requires only changing the data access layer in each route.

### Why Hugging Face Router instead of direct OpenAI?

- **Cost:** HF Router provides access to open-source models at significantly lower cost
- **Flexibility:** Can switch between model providers (Together, Replicate, etc.) without changing application code
- **Open source:** Qwen2.5 and BART are open-weight models — no vendor lock-in

### Why separate BART for summarization?

BART-large-CNN is specifically fine-tuned for summarization tasks and outperforms general instruction-tuned models on this specific task. Using the right model for the right job is a core principle of the multi-agent approach.

### Why human-in-the-loop before localization?

Localization is expensive (in tokens and time). Running it on content that hasn't been approved wastes resources. The human checkpoint ensures only approved content proceeds to downstream agents.

---

## Demo Keywords (for presentations)

- **Multi-agent pipeline** — 7 specialized AI agents working sequentially
- **Human-in-the-loop approval** — Human checkpoint before content proceeds
- **Compliance guardrails** — Automated risk detection before publishing
- **End-to-end automation** — Raw input to analytics-ready output
- **Audit trail** — Complete timestamped log of all agent actions
- **Content lifecycle automation** — Full pipeline from input to distribution

---

## License

MIT License — feel free to use, modify, and distribute.

---

*Built with React 19, Express, and Hugging Face AI — AgentFlow 2025*
