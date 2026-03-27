// In-memory data store — single source of truth for all runtime data
export const store = {
  users: [],           // { id, username, passwordHash }
  plans: [],           // { userId, generatedAt, subjects, examDates, dailyHours, weakTopics, tasks[] }
  quizResults: [],     // { id, userId, topic, score, totalQuestions, timestamp }
  revisionSlots: [],   // { id, userId, topic, dueDate, intervalDays, status }
  sessionLogs: [],     // { userId, date, studyMinutes, tasksCompleted, tasksMissed }
  chatHistories: {},   // { [userId]: [{ role, content }] }
  dismissedRecs: {},   // { [userId]: Set<string> }
};
