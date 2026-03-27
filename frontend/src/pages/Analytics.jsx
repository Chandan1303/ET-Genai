import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { BarChart2, Sparkles } from 'lucide-react';
import MarkdownText from '../components/MarkdownText';

export default function Analytics() {
  const [engagement, setEngagement] = useState({ likes: 0, clicks: 0, shares: 0 });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/agents/analytics', { engagementData: engagement });
      setResult(data.result);
      toast.success('Analytics generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analytics failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Analytics Agent</h1>
          <p className="page-subtitle">Analyze content engagement and get AI-powered improvement suggestions</p>
        </div>
      </div>

      <div className="glass card" style={{ marginBottom: 24, maxWidth: 500 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Enter Engagement Data</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[
            { key: 'likes', icon: '👍', color: '#8b5cf6' },
            { key: 'clicks', icon: '🖱️', color: '#6366f1' },
            { key: 'shares', icon: '🔁', color: '#10b981' },
          ].map(({ key, icon, color }) => (
            <div key={key} className="glass" style={{ padding: '14px', textAlign: 'center', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{key}</div>
              <input
                type="number" min={0}
                value={engagement[key]}
                onChange={e => setEngagement(g => ({ ...g, [key]: Number(e.target.value) }))}
                style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, padding: '6px' }}
              />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? '⏳ Analyzing...' : <><BarChart2 size={14} /> Run Analytics Agent</>}
        </button>
      </div>

      {loading && (
        <div className="glass card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <p style={{ color: 'var(--text-2)' }}>Analyzing engagement data...</p>
          {[100, 80, 90].map((w, i) => <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, margin: '10px auto 0', borderRadius: 6 }} />)}
        </div>
      )}

      {result && !loading && (
        <div className="glass card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#f97316" /> Analytics Report
          </div>
          <MarkdownText content={result} />
        </div>
      )}
    </div>
  );
}
