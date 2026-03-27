import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store.js';

const router = Router();

const INTERVALS = [1, 3, 7, 14]; // Forgetting curve intervals in days

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

router.post('/mark', (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  const today = new Date().toISOString().split('T')[0];
  const slots = [];

  // Schedule all 4 revision slots based on forgetting curve
  let baseDate = today;
  for (const interval of INTERVALS) {
    const dueDate = addDays(baseDate, interval);
    const slot = {
      id: uuidv4(),
      userId: req.userId,
      topic,
      dueDate,
      intervalDays: interval,
      status: 'pending',
    };
    store.revisionSlots.push(slot);
    slots.push(slot);
    baseDate = dueDate; // Each slot is relative to the previous
  }

  res.json({ slots, message: `Revision slots scheduled for "${topic}"` });
});

router.get('/', (req, res) => {
  const slots = store.revisionSlots
    .filter(s => s.userId === req.userId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  res.json({ slots });
});

router.patch('/:slotId/complete', (req, res) => {
  const slot = store.revisionSlots.find(s => s.id === req.params.slotId && s.userId === req.userId);
  if (!slot) return res.status(404).json({ error: 'Revision slot not found' });

  slot.status = 'completed';

  // Schedule next revision at a longer interval if not at max
  const currentIdx = INTERVALS.indexOf(slot.intervalDays);
  let nextSlot = null;
  if (currentIdx < INTERVALS.length - 1) {
    const nextInterval = INTERVALS[currentIdx + 1];
    nextSlot = {
      id: uuidv4(),
      userId: req.userId,
      topic: slot.topic,
      dueDate: addDays(slot.dueDate, nextInterval),
      intervalDays: nextInterval,
      status: 'pending',
    };
    store.revisionSlots.push(nextSlot);
  }

  res.json({ slot, nextSlot });
});

export default router;
