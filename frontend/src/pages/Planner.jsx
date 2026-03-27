import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, CheckCircle2, XCircle, BookMarked, Sparkles, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Planner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ subjects: [], subjectInput: '', examDates: {}, dailyHours: 4, weakTopics: [], weakInput: '' });
  const [selectedMissed, setSelectedMissed] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    api.get('/api/ai/plan').then(r => setPlan(r.data.plan)).catch(() => {}).finally(() => setFetching(false));
  }, []);

  const addSubject = () => {
    if (form.subjectInput.trim()) {
      setForm(f => ({ ...f, subjects: [...f.subjects, f.subjectInput.trim()], subjectInput: '' }));
    }
  };
  const addWeak = () => {
    if (form.weakInput.trim()) {
      setForm(f => ({ ...f, weakTopics: [...f.weakTopics, f.weakInput.trim()], weakInput: '' }));
    }
  };

  const generate = async () => {
    if (!form.subjects.length) return toast.error('Add at least one subject');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/plan', { subjects: form.subjects, examDates: form.examDates, dailyHours: form.dailyHours, weakTopics: form.weakTopics });
      setPlan(data.plan);
      toast.success('Study plan generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate plan');
    } finally { setLoading(false); }
  };

  const reschedule = async () => {
    if (!selectedMissed.length) return toast.error('Select missed tasks first');
    setRescheduling(true);
    try {
      const { data } = await api.post('/api/ai/reschedule', { missedTaskIds: selectedMissed });
      setPlan(data.plan);
      setSelectedMissed([]);
      if (data.warning) toast(data.message, { icon: '⚠️' });
      else toast.success('Plan rescheduled!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rescheduling failed');
    } finally { setRescheduling(false); }
  };

  const markStudied = async (topic) => {
    try {
      await api.post('/api/ai/revision/mark', { topic });
      toast.success(`Revision slots scheduled for "${topic}"`);
    } catch { toast.error('Failed to schedule revision'); }
  };

  const tasksByDate = {};
  plan?.tasks?.forEach(t => {
    if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
    tasksByDate[t.date].push(t);
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Planner</h1>
          <p className="page-subtitle">Generate and manage your personalized study schedule</p>
        </div>
      </div>

      {/* Generator */}
      <div className="glass card" style={{ marginBottom: 28 }}>
        <h2 className="card-title"><Sparkles size={17} color="var(--purple)" /> Generate New Plan</h2>
        <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Subjects</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input placeholder="e.g. Mathematics" value={form.subjectInput} onChange={e => setForm(f => ({ ...f, subjectInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubject()} />
              <button className="btn btn-ghost btn-icon" onClick={addSubject}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.subjects.map(s => <span key={s} className="tag">{s}<button onClick={() => setForm(f => ({ ...f, subjects: f.subjects.filter(x => x !== s) }))}>×</button></span>)}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Daily Study Hours</label>
            <input type="number" min={1} max={12} value={form.dailyHours} onChange={e => setForm(f => ({ ...f, dailyHours: Number(e.target.value) }))} />
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Max hours per day for scheduling</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Weak Topics <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input placeholder="e.g. Calculus" value={form.weakInput} onChange={e => setForm(f => ({ ...f, weakInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addWeak()} />
              <button className="btn btn-ghost btn-icon" onClick={addWeak}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.weakTopics.map(s => <span key={s} className="tag">{s}<button onClick={() => setForm(f => ({ ...f, weakTopics: f.weakTopics.filter(x => x !== s) }))}>×</button></span>)}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ minWidth: 200 }}>
          {loading ? (
            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</>
          ) : (
            <><Sparkles size={15} /> Generate Study Plan</>
          )}
        </button>
      </div>

      {/* Reschedule bar */}
      {selectedMissed.length > 0 && (
        <div className="alert alert-warning animate-up" style={{ marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span>⚠️ {selectedMissed.length} task(s) selected as missed</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={reschedule} disabled={rescheduling}>
              <RefreshCw size={13} /> {rescheduling ? 'Rescheduling...' : 'Reschedule'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMissed([])}>Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {fetching ? (
        <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, marginBottom: 16, borderRadius: 14 }} />)}</div>
      ) : !plan ? (
        <div className="glass card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Calendar size={48} color="var(--text-3)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text-2)', fontSize: 15, fontWeight: 600 }}>No study plan yet</p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6 }}>Fill in the form above and generate your personalized plan.</p>
        </div>
      ) : (
        <div>
          {Object.entries(tasksByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => {
            const isToday = date === today;
            return (
              <div key={date} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? 'var(--purple-light)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {format(parseISO(date), 'EEEE, MMM d')}
                    {isToday && <span className="badge badge-purple" style={{ marginLeft: 8 }}>Today</span>}
                  </span>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                {tasks.map(task => (
                  <div key={task.id} className="glass" style={{
                    padding: '14px 18px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: task.status === 'missed' ? 0.4 : 1,
                    borderLeft: task.status === 'completed' ? '3px solid var(--success)' : task.status === 'missed' ? '3px solid var(--danger)' : '3px solid transparent',
                    transition: 'var(--transition)',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedMissed.includes(task.id)}
                      onChange={e => setSelectedMissed(s => e.target.checked ? [...s, task.id] : s.filter(x => x !== task.id))}
                      style={{ width: 15, height: 15, accentColor: '#8b5cf6', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'completed' ? 'line-through' : 'none', lineHeight: 1.5 }}>{task.topic}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{task.subject} · {task.durationMinutes}min</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {task.status === 'completed' && <span className="badge badge-green"><CheckCircle2 size={11} /> Done</span>}
                      {task.status === 'missed'    && <span className="badge badge-red"><XCircle size={11} /> Missed</span>}
                      {task.status === 'completed' && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markStudied(task.topic)} title="Schedule revision slots">
                          <BookMarked size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
