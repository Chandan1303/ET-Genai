import { useEffect, useState } from 'react';
import api from '../api';

export default function Insights() {
  const [data, setData] = useState(null);
  const [revision, setRevision] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/ai/insights'),
      api.get('/api/ai/revision'),
    ]).then(([ins, rev]) => {
      setData(ins.data);
      setRevision(rev.data.slots || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completeRevision = async (slotId) => {
    try {
      await api.patch(`/api/ai/revision/${slotId}/complete`);
      const { data: rev } = await api.get('/api/ai/revision');
      setRevision(rev.slots || []);
    } catch { /* silent */ }
  };

  const typeColors = { success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#8b5cf6' };
  const today = new Date().toISOString().split('T')[0];
  const dueRevisions = revision.filter(s => s.status === 'pending' && s.dueDate <= today);
  const upcomingRevisions = revision.filter(s => s.status === 'pending' && s.dueDate > today).slice(0, 6);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights & Analytics</h1>
          <p className="page-subtitle">Track your study patterns and revision schedule</p>
        </div>
      </div>

      {/* Insight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 18, marginBottom: 32 }}>
        {loading ? [1,2,3,4,5].map(i => (
          <div key={i} className="glass" style={{ padding: '20px 22px' }}>
            <div className="skeleton" style={{ height: 44, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '75%' }} />
          </div>
        )) : data?.insights?.map(ins => {
          const color = typeColors[ins.type] || '#8b5cf6';
          return (
            <div key={ins.id} className="glass" style={{ padding: '20px 22px', borderTop: `3px solid ${color}`, transition: 'var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 26 }}>{ins.icon}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-1px' }}>{ins.value}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{ins.title}</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{ins.description}</p>
            </div>
          );
        })}
      </div>

      {/* Revision Planner */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Due */}
        <div className="glass card">
          <h2 className="card-title">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
            Due Revisions
          </h2>
          {loading ? [1,2].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 10 }} />) :
            dueRevisions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No revisions due today!</p>
              </div>
            ) : dueRevisions.map(slot => (
              <div key={slot.id} className="glass" style={{ padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid var(--danger)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{slot.topic}</div>
                  <div style={{ fontSize: 12, color: '#f87171', marginTop: 3 }}>Due: {slot.dueDate}</div>
                </div>
                <button className="btn btn-success btn-sm" onClick={() => completeRevision(slot.id)}>Done ✓</button>
              </div>
            ))
          }
        </div>

        {/* Upcoming */}
        <div className="glass card">
          <h2 className="card-title">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
            Upcoming Revisions
          </h2>
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 10 }} />) :
            upcomingRevisions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No upcoming revisions.</p>
                <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 6 }}>Mark topics as studied in the Planner!</p>
              </div>
            ) : upcomingRevisions.map(slot => (
              <div key={slot.id} className="glass" style={{ padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{slot.topic}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Due: {slot.dueDate}</div>
                </div>
                <span className="badge badge-purple">{slot.intervalDays}d interval</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
