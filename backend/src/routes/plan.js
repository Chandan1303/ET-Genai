import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store.js';
import { callFlanT5 } from '../services/hf.js';

const router = Router();

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/^#{1,3}\s+/gm, '')        // ## headers
    .replace(/^[-*]\s+/gm, '')          // bullet points
    .replace(/`(.+?)`/g, '$1')          // `code`
    .trim();
}

function parsePlanFromText(text, subjects, dailyHours) {
  // Parse AI output into structured tasks; fallback to generated structure
  const tasks = [];
  const lines = text.split('\n').filter(l => l.trim());
  const today = new Date();

  lines.forEach((line, i) => {
    const subject = subjects[i % subjects.length] || 'General';
    const date = new Date(today);
    date.setDate(today.getDate() + Math.floor(i / subjects.length));
    tasks.push({
      id: uuidv4(),
      date: date.toISOString().split('T')[0],
      subject,
      topic: stripMarkdown(line.replace(/^[-*\d.]+\s*/, '').trim()) || `Study ${subject}`,
      durationMinutes: Math.floor((dailyHours * 60) / subjects.length),
      status: 'pending',
    });
  });

  // Ensure at least 7 days of tasks if AI returned too little
  if (tasks.length < 7) {
    for (let d = tasks.length; d < 14; d++) {
      const subject = subjects[d % subjects.length] || 'General';
      const date = new Date(today);
      date.setDate(today.getDate() + Math.floor(d / subjects.length));
      tasks.push({
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        subject,
        topic: `Study ${subject} - Session ${d + 1}`,
        durationMinutes: Math.floor((dailyHours * 60) / subjects.length),
        status: 'pending',
      });
    }
  }
  return tasks;
}

router.post('/', async (req, res) => {
  const { subjects, examDates, dailyHours, weakTopics } = req.body;
  if (!subjects?.length || !dailyHours) {
    return res.status(400).json({ error: 'subjects and dailyHours are required' });
  }

  const prevPlan = store.plans.find(p => p.userId === req.userId);

  try {
    const prompt = `Create a detailed study plan for a student.
Subjects: ${subjects.join(', ')}
Exam dates: ${JSON.stringify(examDates || {})}
Daily study hours: ${dailyHours}
Weak topics: ${(weakTopics || []).join(', ')}
Generate a day-by-day study schedule with specific topics for each subject. List each task on a new line.`;

    const aiText = await callFlanT5(prompt);
    const tasks = parsePlanFromText(aiText, subjects, dailyHours);

    const plan = {
      userId: req.userId,
      generatedAt: new Date().toISOString(),
      subjects,
      examDates: examDates || {},
      dailyHours,
      weakTopics: weakTopics || [],
      tasks,
    };

    // Replace existing plan
    const idx = store.plans.findIndex(p => p.userId === req.userId);
    if (idx >= 0) store.plans[idx] = plan;
    else store.plans.push(plan);

    res.json({ plan });
  } catch (err) {
    console.error(err);
    if (prevPlan) return res.status(504).json({ error: 'AI service unavailable. Previous plan preserved.', plan: prevPlan });
    res.status(504).json({ error: 'AI service unavailable. Please try again.' });
  }
});

router.get('/', (req, res) => {
  const plan = store.plans.find(p => p.userId === req.userId);
  if (!plan) return res.json({ plan: null });
  res.json({ plan });
});

router.patch('/task/:taskId', (req, res) => {
  const plan = store.plans.find(p => p.userId === req.userId);
  if (!plan) return res.status(404).json({ error: 'No plan found' });

  const task = plan.tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { status } = req.body;
  if (!['pending', 'completed', 'missed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  task.status = status;

  // Log session
  const today = new Date().toISOString().split('T')[0];
  let log = store.sessionLogs.find(l => l.userId === req.userId && l.date === today);
  if (!log) {
    log = { userId: req.userId, date: today, studyMinutes: 0, tasksCompleted: 0, tasksMissed: 0 };
    store.sessionLogs.push(log);
  }
  if (status === 'completed') { log.tasksCompleted++; log.studyMinutes += task.durationMinutes; }
  if (status === 'missed') log.tasksMissed++;

  res.json({ task });
});

export default router;
