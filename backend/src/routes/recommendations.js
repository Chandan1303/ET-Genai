import { Router } from 'express';
import { store } from '../store.js';

const router = Router();

router.get('/', (req, res) => {
  const plan = store.plans.find(p => p.userId === req.userId);
  const quizResults = store.quizResults.filter(r => r.userId === req.userId);
  const dismissed = store.dismissedRecs[req.userId] || new Set();

  const recs = [];

  // Weak topic recommendations
  const weakTopics = quizResults.filter(r => r.score < 60).map(r => r.topic);
  weakTopics.slice(0, 2).forEach(topic => {
    const id = `weak-${topic}`;
    if (!dismissed.has(id)) {
      recs.push({ id, type: 'weak', icon: '⚠️', title: `Focus on ${topic}`, description: `Your quiz score for ${topic} was below 60%. Schedule extra practice sessions.`, priority: 'high' });
    }
  });

  // Upcoming exam recommendations
  if (plan?.examDates) {
    Object.entries(plan.examDates).forEach(([subject, date]) => {
      const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 7) {
        const id = `exam-${subject}`;
        if (!dismissed.has(id)) {
          recs.push({ id, type: 'exam', icon: '📅', title: `${subject} exam in ${daysLeft} days`, description: `Intensify your ${subject} revision. Focus on key topics and past questions.`, priority: 'high' });
        }
      }
    });
  }

  // Revision due recommendations
  const today = new Date().toISOString().split('T')[0];
  const dueRevisions = store.revisionSlots.filter(s => s.userId === req.userId && s.status === 'pending' && s.dueDate <= today);
  dueRevisions.slice(0, 2).forEach(slot => {
    const id = `revision-${slot.id}`;
    if (!dismissed.has(id)) {
      recs.push({ id, type: 'revision', icon: '🔄', title: `Revise ${slot.topic}`, description: `Scheduled revision for "${slot.topic}" is due today. Review your notes to reinforce memory.`, priority: 'medium' });
    }
  });

  // General recommendations to fill up to 3
  const generals = [
    { id: 'gen-pomodoro', type: 'tip', icon: '🍅', title: 'Try the Pomodoro Technique', description: 'Study for 25 minutes, then take a 5-minute break. This improves focus and retention.', priority: 'low' },
    { id: 'gen-review', type: 'tip', icon: '📖', title: 'Review yesterday\'s notes', description: 'Spending 10 minutes reviewing yesterday\'s material significantly improves long-term retention.', priority: 'low' },
    { id: 'gen-quiz', type: 'tip', icon: '🧠', title: 'Take a practice quiz', description: 'Active recall through quizzes is more effective than passive re-reading.', priority: 'low' },
  ];

  generals.forEach(g => {
    if (recs.length < 5 && !dismissed.has(g.id)) recs.push(g);
  });

  res.json({ recommendations: recs.slice(0, 5) });
});

router.post('/dismiss', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!store.dismissedRecs[req.userId]) store.dismissedRecs[req.userId] = new Set();
  store.dismissedRecs[req.userId].add(id);

  res.json({ message: 'Recommendation dismissed' });
});

export default router;
