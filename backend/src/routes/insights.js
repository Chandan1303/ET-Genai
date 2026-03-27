import { Router } from 'express';
import { store } from '../store.js';

const router = Router();

const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The expert in anything was once a beginner. — Helen Hayes",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Study hard, for the well is deep, and our brains are shallow. — Richard Baxter",
  "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
];

router.get('/', (req, res) => {
  const logs = store.sessionLogs.filter(l => l.userId === req.userId);
  const quizResults = store.quizResults.filter(r => r.userId === req.userId);

  const totalMinutes = logs.reduce((s, l) => s + l.studyMinutes, 0);
  const totalCompleted = logs.reduce((s, l) => s + l.tasksCompleted, 0);
  const totalMissed = logs.reduce((s, l) => s + l.tasksMissed, 0);
  const totalTasks = totalCompleted + totalMissed;
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((s, r) => s + r.score, 0) / quizResults.length)
    : 0;

  // Find peak study day
  const byDay = {};
  logs.forEach(l => { byDay[l.date] = (byDay[l.date] || 0) + l.studyMinutes; });
  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  // Weekly completion rate
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekLogs = logs.filter(l => new Date(l.date) >= oneWeekAgo);
  const weekCompleted = weekLogs.reduce((s, l) => s + l.tasksCompleted, 0);
  const weekMissed = weekLogs.reduce((s, l) => s + l.tasksMissed, 0);
  const weekTotal = weekCompleted + weekMissed;
  const weekRate = weekTotal > 0 ? weekCompleted / weekTotal : 1;

  const insights = [
    {
      id: 'total-study',
      icon: '⏱️',
      title: 'Total Study Time',
      value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      description: totalMinutes > 0 ? `You've studied for ${Math.floor(totalMinutes / 60)} hours total. Keep it up!` : 'Start studying to track your time.',
      type: 'info',
    },
    {
      id: 'completion-rate',
      icon: '✅',
      title: 'Task Completion Rate',
      value: `${completionRate}%`,
      description: completionRate >= 70 ? 'Excellent consistency! You complete most of your planned tasks.' : completionRate >= 50 ? 'Good progress, but try to complete more planned tasks.' : 'Your completion rate needs improvement. Try smaller daily goals.',
      type: completionRate >= 70 ? 'success' : completionRate >= 50 ? 'warning' : 'danger',
    },
    {
      id: 'quiz-performance',
      icon: '🧠',
      title: 'Average Quiz Score',
      value: quizResults.length > 0 ? `${avgScore}%` : 'No quizzes yet',
      description: quizResults.length > 0 ? `Based on ${quizResults.length} quiz${quizResults.length > 1 ? 'zes' : ''}. ${avgScore >= 70 ? 'Strong performance!' : 'Keep practicing to improve.'}` : 'Take quizzes to track your knowledge.',
      type: avgScore >= 70 ? 'success' : 'warning',
    },
    {
      id: 'peak-day',
      icon: '🔥',
      title: 'Most Productive Day',
      value: peakDay ? peakDay[0] : 'N/A',
      description: peakDay ? `You studied ${Math.floor(peakDay[1] / 60)}h ${peakDay[1] % 60}m on your best day.` : 'Complete study sessions to find your peak day.',
      type: 'info',
    },
    {
      id: 'streak',
      icon: '📅',
      title: 'Weekly Progress',
      value: weekTotal > 0 ? `${Math.round(weekRate * 100)}%` : 'No data',
      description: weekRate < 0.5 && weekTotal > 0 ? 'Your weekly completion is below 50%. Consider a lighter schedule.' : 'Keep maintaining your weekly study rhythm.',
      type: weekRate < 0.5 && weekTotal > 0 ? 'warning' : 'success',
    },
  ];

  // Break suggestion: check if studied > 2h today
  const todayLog = logs.find(l => l.date === new Date().toISOString().split('T')[0]);
  const breakSuggestion = todayLog && todayLog.studyMinutes > 120
    ? { show: true, message: "You've been studying for over 2 hours today. Take a 15-minute break to recharge!" }
    : { show: false };

  // Motivation
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // Low completion encouragement
  const encouragement = weekRate < 0.5 && weekTotal > 0
    ? { show: true, message: "Don't be too hard on yourself! Try reducing your daily tasks and focus on consistency over quantity." }
    : { show: false };

  res.json({ insights, breakSuggestion, quote, encouragement, stats: { totalMinutes, completionRate, avgScore, weekRate: Math.round(weekRate * 100) } });
});

export default router;
