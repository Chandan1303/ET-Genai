import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store.js';
import { callFlanT5 } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { missedTaskIds } = req.body;
  if (!missedTaskIds?.length) return res.status(400).json({ error: 'missedTaskIds array is required' });

  const plan = store.plans.find(p => p.userId === req.userId);
  if (!plan) return res.status(404).json({ error: 'No study plan found' });

  const missedTasks = plan.tasks.filter(t => missedTaskIds.includes(t.id));
  const pendingTasks = plan.tasks.filter(t => t.status === 'pending' && !missedTaskIds.includes(t.id));

  // Mark missed tasks
  missedTasks.forEach(t => { t.status = 'missed'; });

  const today = new Date().toISOString().split('T')[0];
  const futureDates = [...new Set(pendingTasks.map(t => t.date))].filter(d => d >= today).sort();

  if (futureDates.length === 0) {
    return res.json({
      plan,
      warning: true,
      message: 'No remaining days to reschedule. Consider extending your study period.',
    });
  }

  try {
    const missedDesc = missedTasks.map(t => `${t.subject}: ${t.topic} (${t.durationMinutes}min)`).join(', ');
    const prompt = `A student missed these study tasks: ${missedDesc}.
They have ${futureDates.length} remaining study days and ${plan.dailyHours} hours per day.
Suggest how to redistribute these missed topics across the remaining days without overloading.
List one topic per line.`;

    const aiText = await callFlanT5(prompt);
    const suggestions = aiText.split('\n').filter(l => l.trim());

    // Redistribute missed tasks across future dates
    const dailyMaxMinutes = plan.dailyHours * 60;
    const dailyUsed = {};
    pendingTasks.forEach(t => {
      dailyUsed[t.date] = (dailyUsed[t.date] || 0) + t.durationMinutes;
    });

    let warning = false;
    const rescheduled = [];

    for (let i = 0; i < missedTasks.length; i++) {
      const task = { ...missedTasks[i], id: uuidv4(), status: 'pending' };
      const topic = suggestions[i] ? suggestions[i].replace(/^[-*\d.]+\s*/, '').trim() : task.topic;
      task.topic = topic;

      const availableDate = futureDates.find(d => (dailyUsed[d] || 0) + task.durationMinutes <= dailyMaxMinutes);
      if (availableDate) {
        task.date = availableDate;
        dailyUsed[availableDate] = (dailyUsed[availableDate] || 0) + task.durationMinutes;
        rescheduled.push(task);
        plan.tasks.push(task);
      } else {
        warning = true;
      }
    }

    res.json({
      plan,
      rescheduled,
      warning,
      message: warning ? 'Some tasks could not be rescheduled. Consider extending your study period.' : 'Plan rescheduled successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Rescheduling service unavailable. Please try again.' });
  }
});

export default router;
