import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Sparkles, Copy } from 'lucide-react';
import MarkdownText from '../components/MarkdownText';

export default function Explain() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('beginner');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true); setExplanation('');
    try {
      const { data } = await api.post('/api/ai/explain', { topic, level });
      setExplanation(data.explanation);
      toast.success('Explanation ready!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate explanation');
    } finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(explanation); toast.success('Copied!'); };

  const examples = ['Deadlock in OS', 'Recursion in Programming', 'Photosynthesis', 'Newton\'s Laws', 'Blockchain Technology', 'DNA Replication'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Explanation Tool</h1>
          <p className="page-subtitle">Get clear, structured explanations for any concept at your level</p>
        </div>
      </div>

      <div className="glass card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <input placeholder="Enter concept (e.g. Deadlock in OS)" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && explain()} style={{ flex: 1, minWidth: 200 }} />
          <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: 160 }}>
            <option value="beginner">🟢 Beginner</option>
            <option value="intermediate">🟡 Intermediate</option>
            <option value="advanced">🔴 Advanced</option>
          </select>
          <button className="btn btn-primary" onClick={explain} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '⏳ Explaining...' : <><Sparkles size={14} /> Explain</>}
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
        <div className="glass card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <p style={{ color: 'var(--text-2)' }}>Generating explanation...</p>
          {[100, 80, 90, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, margin: '10px auto 0', borderRadius: 6 }} />
          ))}
        </div>
      )}

          {explanation && !loading && (
            <div className="glass card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>{topic}</h2>
                  <span className={`badge ${level === 'beginner' ? 'badge-green' : level === 'intermediate' ? 'badge-yellow' : 'badge-red'}`} style={{ marginTop: 6 }}>
                    {level === 'beginner' ? '🟢 Beginner' : level === 'intermediate' ? '🟡 Intermediate' : '🔴 Advanced'}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={copy}><Copy size={13} /> Copy</button>
              </div>
              <MarkdownText content={explanation} />
            </div>
          )}
    </div>
  );
}
