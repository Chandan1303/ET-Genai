# Design Document — AI Personal Study Planner

## Overview

AI Personal Study Planner is a full-stack web application that combines a Node.js/Express backend with a React frontend to deliver a GenAI-powered study mentoring experience. The system uses three Hugging Face Inference API models (Flan-T5, BART, Mistral) to power ten distinct AI features. All data is stored in-memory on the server. Authentication is handled via JWT. The UI follows a dark-mode-first glassmorphism design with purple-indigo gradients.

---

## Architecture

```mermaid
graph TD
  subgraph Frontend [React Frontend - Vite]
    LP[Landing Page]
    Login[Login / Register]
    Dashboard[Dashboard]
    Planner[Planner Page]
    AITools[AI Tools Page]
    Chatbot[Chatbot Page]
    Insights[Insights Page]
    FloatingChat[Floating Chat Button]
  end

  subgraph Backend [Node.js / Express API]
    Auth[/api/auth/*]
    PlanAPI[/api/ai/plan]
    SumAPI[/api/ai/summarize]
    QuizAPI[/api/ai/quiz]
    WeakAPI[/api/ai/weak-topics]
    ReschedAPI[/api/ai/reschedule]
    ChatAPI[/api/ai/chat]
    InsightAPI[/api/ai/insights]
    RevisionAPI[/api/ai/revision]
    MemStore[In-Memory Store]
    JWTMiddleware[JWT Middleware]
  end

  subgraph HuggingFace [Hugging Face Inference API]
    FlanT5[google/flan-t5-large]
    BART[facebook/bart-large-cnn]
    Mistral[mistralai/Mistral-7B-Instruct]
  end

  Frontend -->|HTTP + JWT| Backend
  Auth --> MemStore
  PlanAPI --> FlanT5
  SumAPI --> BART
  QuizAPI --> Mistral
  WeakAPI --> Mistral
  ReschedAPI --> FlanT5
  ChatAPI --> Mistral
  InsightAPI --> MemStore
  RevisionAPI --> MemStore
  Backend --> MemStore
```

---

## Components and Interfaces

### Backend Components

#### 1. Auth Module (`/api/auth`)
- `POST /api/auth/register` — creates user, hashes password with bcrypt
- `POST /api/auth/login` — validates credentials, returns signed JWT
- JWT middleware validates `Authorization: Bearer <token>` on all `/api/ai/*` routes

#### 2. AI Plan Service (`/api/ai/plan`)
- `POST /api/ai/plan` — accepts `{ subjects, examDates, dailyHours, weakTopics }`, calls Flan-T5, returns structured plan
- `GET /api/ai/plan` — returns current plan for authenticated student

#### 3. AI Summarizer (`/api/ai/summarize`)
- `POST /api/ai/summarize` — accepts `{ text }`, validates length ≥ 50 chars, calls BART, returns bullet points

#### 4. AI Quiz Service (`/api/ai/quiz`)
- `POST /api/ai/quiz` — accepts `{ topic, type }` where type ∈ {mcq, one-word, match}, calls Mistral, returns questions
- `POST /api/ai/quiz/submit` — accepts `{ quizId, answers }`, scores quiz, stores result

#### 5. Weak Topic Analyzer (`/api/ai/weak-topics`)
- `POST /api/ai/weak-topics` — reads stored quiz results for student, calls Mistral, returns weak areas + improvement plan

#### 6. Dynamic Rescheduler (`/api/ai/reschedule`)
- `POST /api/ai/reschedule` — accepts `{ missedTasks }`, calls Flan-T5 with remaining schedule, returns revised plan

#### 7. Chatbot (`/api/ai/chat`)
- `POST /api/ai/chat` — accepts `{ message, history }`, calls Mistral with full conversation context, returns response

#### 8. Insights (`/api/ai/insights`)
- `GET /api/ai/insights` — reads session/quiz data from memory, generates productivity observations

#### 9. Revision Planner (`/api/ai/revision`)
- `POST /api/ai/revision/mark` — marks topic as studied, schedules forgetting-curve revision slots
- `GET /api/ai/revision` — returns upcoming revision slots

### Frontend Components

| Component | Route | Description |
|---|---|---|
| LandingPage | `/` | Hero, features, CTA |
| AuthPage | `/login` | Glass login/register form |
| Dashboard | `/dashboard` | Plan overview, insights, weak topics, AI suggestions |
| PlannerPage | `/planner` | Generate/view/reschedule plan, calendar view |
| AIToolsPage | `/tools` | Summarizer, quiz generator, weak topic analyzer |
| ChatbotPage | `/chat` | Full-screen chat interface |
| InsightsPage | `/insights` | Productivity insight cards |
| FloatingChatButton | global | Overlay button linking to chatbot |

---

## Data Models

### In-Memory Store Structure

```typescript
interface User {
  id: string;           // uuid
  username: string;
  passwordHash: string;
}

interface StudyPlan {
  userId: string;
  generatedAt: string;  // ISO timestamp
  subjects: string[];
  examDates: Record<string, string>;
  dailyHours: number;
  weakTopics: string[];
  tasks: DailyTask[];
}

interface DailyTask {
  id: string;
  date: string;         // YYYY-MM-DD
  subject: string;
  topic: string;
  durationMinutes: number;
  status: 'pending' | 'completed' | 'missed';
}

interface QuizResult {
  id: string;
  userId: string;
  topic: string;
  score: number;        // 0-100
  totalQuestions: number;
  timestamp: string;
}

interface RevisionSlot {
  id: string;
  userId: string;
  topic: string;
  dueDate: string;
  intervalDays: number; // 1, 3, 7, 14
  status: 'pending' | 'completed';
}

interface SessionLog {
  userId: string;
  date: string;
  studyMinutes: number;
  tasksCompleted: number;
  tasksMissed: number;
}

// Top-level store
const store = {
  users: User[],
  plans: StudyPlan[],
  quizResults: QuizResult[],
  revisionSlots: RevisionSlot[],
  sessionLogs: SessionLog[],
  chatHistories: Record<userId, ChatMessage[]>
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT authentication gates all AI routes

*For any* request to `/api/ai/*` endpoints, if the request does not include a valid JWT token, the system should return a 401 status code and never invoke an AI model call.

**Validates: Requirements 1.3**

---

### Property 2: Study plan task hours respect daily limit

*For any* generated study plan with a configured `dailyHours` value, the sum of `durationMinutes` for all tasks on any single day should not exceed `dailyHours × 60` minutes.

**Validates: Requirements 2.1, 6.3**

---

### Property 3: Summarizer rejects short input

*For any* text input with fewer than 50 characters, the summarizer endpoint should return a 4xx error without calling the BART model.

**Validates: Requirements 3.3**

---

### Property 4: Quiz result storage round trip

*For any* completed quiz submission, storing the result and then retrieving quiz results for that user should return a collection containing the submitted result with the same topic, score, and userId.

**Validates: Requirements 4.4**

---

### Property 5: Weak topic detection requires quiz data

*For any* student with zero stored quiz results, calling the weak topic analysis endpoint should return an error response prompting the student to complete a quiz first, without calling the AI model.

**Validates: Requirements 5.4**

---

### Property 6: Rescheduled plan preserves daily hour constraint

*For any* rescheduled plan, the sum of task durations on any single day should not exceed the student's configured `dailyHours × 60` minutes.

**Validates: Requirements 6.3**

---

### Property 7: Forgetting curve revision slots are monotonically increasing

*For any* topic marked as studied, the sequence of scheduled revision slot intervals should be strictly increasing (1 → 3 → 7 → 14 days), and each slot's `dueDate` should equal the previous slot's `dueDate` plus the next interval.

**Validates: Requirements 11.1, 11.3**

---

### Property 8: Chatbot history is append-only within a session

*For any* sequence of chat messages sent by a student in a session, the conversation history returned with each response should contain all previous messages in the original order, with the new message appended at the end.

**Validates: Requirements 8.2**

---

### Property 9: Theme preference persists across page reloads

*For any* theme toggle action (dark → light or light → dark), the selected theme value stored in localStorage should match the currently applied theme class on the document root.

**Validates: Requirements 12.2**

---

### Property 10: Missed task rescheduling covers all missed tasks

*For any* set of missed tasks submitted to the rescheduler, every missed task should appear in the regenerated plan (either as a rescheduled task or explicitly noted as unschedulable), and no missed task should be silently dropped.

**Validates: Requirements 6.1, 6.4**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| HuggingFace API timeout (>30s) | Return 504 with message; preserve previous data |
| HuggingFace API 5xx | Return 502 with retry suggestion |
| Invalid JWT | Return 401 |
| Validation failure (short text, missing fields) | Return 400 with field-level error messages |
| Duplicate username on register | Return 409 Conflict |
| No quiz data for weak topic analysis | Return 422 with prompt to take a quiz |
| All days insufficient for rescheduling | Return 200 with warning flag in response body |

All errors are surfaced to the frontend as toast notifications. AI call failures never corrupt existing stored data.

---

## Testing Strategy

### Unit Testing (Vitest)

Unit tests cover:
- Auth logic: password hashing, JWT signing/verification
- Validation functions: text length check, quiz type enum validation
- In-memory store CRUD helpers
- Forgetting curve interval calculation
- Daily hours constraint checker

### Property-Based Testing (fast-check)

The project uses **fast-check** (JavaScript/TypeScript PBT library) for all correctness properties listed above.

Each property-based test:
- Runs a minimum of **100 iterations** with randomly generated inputs
- Is tagged with a comment in the format: `// Feature: ai-study-planner, Property {N}: {property_text}`
- Maps 1:1 to a correctness property in this design document

**Key generators:**
- `fc.record({ subjects: fc.array(fc.string()), dailyHours: fc.integer({min:1,max:12}), ... })` for study plan inputs
- `fc.string({ minLength: 0, maxLength: 200 })` for summarizer input testing
- `fc.array(fc.record({ topic: fc.string(), score: fc.integer({min:0,max:100}) }))` for quiz result sequences
- `fc.array(fc.string(), { minLength: 1 })` for missed task lists

Property tests are co-located with source files using `.test.ts` suffix and run via `vitest --run`.
