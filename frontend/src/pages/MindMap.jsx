import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

function MindMapViz({ data }) {
  if (!data) return null;
  const { center, branches = [] } = data;

  return (
    <div style={{ padding: '32px 16px', overflowX: 'auto' }}>
      {/* Center node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{
          padding: '16px 32px', borderRadius: 16,
          background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.3))',
          border: '2px solid rgba(139,92,246,0.5)',
          fontSize: 18, fontWeight: 800, color: 'var(--text)',
          textAlign: 'center', maxWidth: 300,
          boxShadow: '0 0 32px rgba(139,92,246,0.2)',
        }}>
          {center}
        </div>

        {/* Branches */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(branches.length, 3)}, 1fr)`, gap: 20, width: '100%', maxWidth: 1000 }}>
          {branches.map((branch, bi) => (
            <div key={bi} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Branch node */}
              <div style={{
                padding: '12px 18px', borderRadius: 12,
                background: `${branch.color}20`,
                border: `2px solid ${branch.color}50`,
                fontSize: 14, fontWeight: 700, color: branch.color,
                textAlign: 'center',
              }}>
                {branch.label}
              </div>

              {/* Children */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12, borderLeft: `2px solid ${branch.color}30` }}>
                {branch.children?.map((child, ci) => (
                  <div key={ci} style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text-2)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: branch.color, flexShrink: 0 }} />
                    {child}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MindMap() {
  const [topic, setTopic] = useState('');
  const [mindmap, setMindmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true); setMindmap(null);
    try {
      const { data } = await api.post('/api/ai/mindmap', { topic });
      setMindmap(data.mindmap);
      toast.success('Mind map generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally { setLoading(false); }
  };

  const examples = ['Operating Systems', 'Machine Learning', 'World War II', 'Human Digestive System', 'Data Structures'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧠 Mind Map Generator</h1>
          <p className="page-subtitle">Visualize topics as structured mind maps for better understanding</p>
        </div>
      </div>

      <div className="glass card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <input placeholder="Enter topic (e.g. Operating Systems)" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} />
          <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '⏳ Generating...' : <><Sparkles size={14} /> Generate</>}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>Try:</span>
          {examples.map(ex => (
            <button key={ex} className="btn btn-ghost btn-sm" onClick={() => setTopic(ex)} style={{ fontSize: 12 }}>{ex}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
          <p style={{ color: 'var(--text-2)' }}>Building mind map...</p>
          <div className="skeleton" style={{ height: 6, width: 200, margin: '16px auto 0', borderRadius: 99 }} />
        </div>
      )}

      {mindmap && !loading && (
        <div className="glass card">
          <h2 className="card-title">🧠 {topic}</h2>
          <MindMapViz data={mindmap} />

          {/* Text summary */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
            {mindmap.branches?.map((branch, i) => (
              <div key={i} className="glass" style={{ padding: '14px 16px', borderLeft: `3px solid ${branch.color}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: branch.color, marginBottom: 8 }}>{branch.label}</div>
                {branch.children?.map((c, j) => (
                  <div key={j} style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 4 }}>• {c}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
