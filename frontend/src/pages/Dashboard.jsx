import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Sparkles, GitBranch, CheckCircle, Globe, Send, BarChart2, ArrowRight, Clock } from 'lucide-react';

const PIPELINE_STAGES = [
  { icon: '↑', label: 'Input Agent',        desc: 'Clean & structure raw content',        color: '#8b5cf6', path: '/pipeline' },
  { icon: '✦', label: 'Content Agent',       desc: 'Blog, LinkedIn, Email, Product Desc',  color: '#6366f1', path: '/pipeline' },
  { icon: '◈', label: 'Compliance Agent',    desc: 'Tone, grammar, legal risk check',      color: '#f59e0b', path: '/pipeline' },
  { icon: '◉', label: 'Human Review',        desc: 'Approve, reject, or edit content',     color: '#3b82f6', path: '/pipeline' },
  { icon: '◎', label: 'Localization Agent',  desc: 'Translate to Kannada & Hindi',         color: '#10b981', path: '/pipeline' },
  { icon: '▷', label: 'Distribution Agent',  desc: 'Format for LinkedIn, Email, Blog',     color: '#ec4899', path: '/pipeline' },
  { icon: '◈', label: 'Analytics Agent',     desc: 'Engagement insights & suggestions',    color: '#f97316', path: '/pipeline' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ai/agents/sessions')
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stageColors = {
    input: '#8b5cf6', content: '#6366f1', compliance: '#f59e0b',
    human: '#3b82f6', localization: '#10b981', distribution: '#ec4899',
    complete: '#10b981',
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user?.username} <span style={{ WebkitTextFillColor: 'initial', background: 'none' }}>👋</span></h1>
          <p className="page-subtitle">Multi-Agent Content Pipeline — End-to-end content lifecycle automation</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
          <Sparkles size={14} /> New Pipeline Run <ArrowRight size={14} />
        </button>
      </div>

      {/* Pipeline overview */}
      <div className="glass card" style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>🔄 Pipeline Architecture</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {PIPELINE_STAGES.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className="glass"
                style={{ padding: '12px 14px', minWidth: 120, cursor: 'pointer', transition: 'var(--transition)', borderTop: `3px solid ${s.color}` }}
                onClick={() => navigate(s.path)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 12, color: s.color, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <ArrowRight size={16} color="var(--text-3)" style={{ flexShrink: 0, margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Recent sessions */}
        <div className="glass card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--purple)" /> Recent Pipeline Runs
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 10, borderRadius: 10 }} />)
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No pipeline runs yet.</p>
              <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 6 }}>Start your first multi-agent pipeline run!</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/pipeline')}>
                <Sparkles size={13} /> Start Pipeline
              </button>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="glass" style={{ padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, borderLeft: `3px solid ${stageColors[s.stage] || '#8b5cf6'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title || 'Untitled'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{new Date(s.createdAt).toLocaleString()}</div>
              </div>
              <span className="badge" style={{ background: `${stageColors[s.stage] || '#8b5cf6'}20`, color: stageColors[s.stage] || '#8b5cf6', border: `1px solid ${stageColors[s.stage] || '#8b5cf6'}40` }}>
                {s.stage}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="glass card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⚡ Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: Sparkles,     color: '#8b5cf6', label: 'Start New Pipeline',        desc: 'Run the full 6-agent pipeline',         path: '/pipeline' },
              { icon: GitBranch,    color: '#6366f1', label: 'Content Generation Only',   desc: 'Skip to content agent directly',        path: '/pipeline' },
              { icon: CheckCircle,  color: '#f59e0b', label: 'Compliance Check',          desc: 'Review existing content for issues',    path: '/pipeline' },
              { icon: Globe,        color: '#10b981', label: 'Localize Content',          desc: 'Translate to Kannada & Hindi',          path: '/pipeline' },
              { icon: Send,         color: '#ec4899', label: 'Distribution Formats',      desc: 'Format for all platforms',              path: '/pipeline' },
              { icon: BarChart2,    color: '#f97316', label: 'Analytics Dashboard',       desc: 'View engagement insights',              path: '/pipeline' },
            ].map(({ icon: Icon, color, label, desc, path }) => (
              <div key={label} className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'var(--transition)' }}
                onClick={() => navigate(path)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{desc}</div>
                </div>
                <ArrowRight size={14} color="var(--text-3)" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
