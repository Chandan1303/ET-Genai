import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Shield, GitMerge, Sliders, Clock, TrendingUp, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import MarkdownText from '../components/MarkdownText';

function ToolCard({ icon: Icon, color, title, desc, open, onToggle, children }) {
  return (
    <div className="glass card" style={{ borderTop: `3px solid ${color}`, marginBottom: 16 }}>
      <button onClick={onToggle} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: open ? 20 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={19} color={color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Nunito',sans-serif", color: 'var(--text)' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
          </div>
          {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
        </div>
      </button>
      {open && <div className="animate-up">{children}</div>}
    </div>
  );
}

function RiskScorer() {
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) return toast.error('Enter content to score');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/tools/risk-score', { content });
      setResult(data);
      toast.success('Risk score generated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const levelColor = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
  const levelBg = { LOW: 'rgba(16,185,129,0.1)', MEDIUM: 'rgba(245,158,11,0.1)', HIGH: 'rgba(239,68,68,0.1)' };

  return (
    <ToolCard icon={Shield} color="#ef4444" title="⚖️ Risk Scoring System" desc="Low / Medium / High risk assessment with flagged phrases" open={open} onToggle={() => setOpen(o => !o)}>
      <textarea rows={5} placeholder="Paste content to analyze for legal, brand, compliance, and ethical risks..." value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
      <button className="btn btn-primary" onClick={run} disabled={loading || !content.trim()} style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', marginBottom: result ? 16 : 0 }}>
        {loading ? '⏳ Analyzing...' : <><Shield size={14} /> Analyze Risk</>}
      </button>
      {result && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: levelBg[result.level] || levelBg.MEDIUM, border: `1px solid ${levelColor[result.level] || '#f59e0b'}30`, borderRadius: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: levelColor[result.level] || '#f59e0b' }}>{result.score}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: levelColor[result.level] || '#f59e0b' }}>Risk Level: {result.level}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Score out of 100 — lower is safer</div>
            </div>
          </div>
          <MarkdownText content={result.result} />
        </div>
      )}
    </ToolCard>
  );
}

function ABTester() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) return toast.error('Enter content to test');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/tools/ab-test', { content, platform });
      setResult(data.result);
      toast.success('A/B versions generated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ToolCard icon={GitMerge} color="#8b5cf6" title="🔀 Auto A/B Testing" desc="Generate and compare two content versions with performance predictions" open={open} onToggle={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: 160 }}>
          <option>LinkedIn</option><option>Email</option><option>Blog</option><option>Twitter</option>
        </select>
      </div>
      <textarea rows={5} placeholder="Paste your content to generate two A/B test versions..." value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
      <button className="btn btn-primary" onClick={run} disabled={loading || !content.trim()} style={{ marginBottom: result ? 16 : 0 }}>
        {loading ? '⏳ Generating versions...' : <><GitMerge size={14} /> Generate A/B Versions</>}
      </button>
      {result && <MarkdownText content={result} />}
    </ToolCard>
  );
}

function ToneCustomizer() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('business professionals');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) return toast.error('Enter content to customize');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/tools/tone', { content, tone, audience });
      setResult(data.result);
      toast.success('Tone customized!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ToolCard icon={Sliders} color="#6366f1" title="🎨 Tone Customization" desc="Rewrite content in formal, casual, technical, or persuasive tone" open={open} onToggle={() => setOpen(o => !o)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Tone</label>
          <select value={tone} onChange={e => setTone(e.target.value)}>
            <option value="professional">Professional</option>
            <option value="casual">Casual & Friendly</option>
            <option value="technical">Technical</option>
            <option value="persuasive">Persuasive</option>
            <option value="inspirational">Inspirational</option>
            <option value="formal">Formal</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)}>
            <option value="business professionals">Business Professionals</option>
            <option value="developers">Developers</option>
            <option value="students">Students</option>
            <option value="executives">Executives</option>
            <option value="general public">General Public</option>
          </select>
        </div>
      </div>
      <textarea rows={5} placeholder="Paste content to rewrite in a different tone..." value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
      <button className="btn btn-primary" onClick={run} disabled={loading || !content.trim()} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', marginBottom: result ? 16 : 0 }}>
        {loading ? '⏳ Rewriting...' : <><Sliders size={14} /> Customize Tone</>}
      </button>
      {result && <MarkdownText content={result} />}
    </ToolCard>
  );
}

function PublishTimer() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ contentType: 'LinkedIn Post', industry: 'Technology', targetAudience: 'Business professionals' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/tools/publish-time', form);
      setResult(data.result);
      toast.success('Publishing schedule ready!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ToolCard icon={Clock} color="#10b981" title="⏰ Best Time to Publish" desc="AI-predicted optimal publishing windows for maximum engagement" open={open} onToggle={() => setOpen(o => !o)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'contentType', label: 'Content Type', options: ['LinkedIn Post', 'Blog Post', 'Email Campaign', 'Twitter Post'] },
          { key: 'industry', label: 'Industry', options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Marketing'] },
          { key: 'targetAudience', label: 'Audience', options: ['Business professionals', 'Developers', 'Students', 'Executives', 'Consumers'] },
        ].map(({ key, label, options }) => (
          <div key={key}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
            <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={run} disabled={loading} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', marginBottom: result ? 16 : 0 }}>
        {loading ? '⏳ Predicting...' : <><Clock size={14} /> Get Best Publish Times</>}
      </button>
      {result && <MarkdownText content={result} />}
    </ToolCard>
  );
}

function PerformancePredictor() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!content.trim()) return toast.error('Enter content to predict');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/tools/predict', { content, platform });
      setResult(data);
      toast.success('Prediction ready!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const perfColor = { POOR: '#ef4444', AVERAGE: '#f59e0b', GOOD: '#6366f1', EXCELLENT: '#10b981' };

  return (
    <ToolCard icon={TrendingUp} color="#f97316" title="📈 Performance Prediction" desc="Predict engagement before publishing — hook, readability, CTA scores" open={open} onToggle={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: 160 }}>
          <option>LinkedIn</option><option>Email</option><option>Blog</option><option>Twitter</option>
        </select>
      </div>
      <textarea rows={5} placeholder="Paste content to predict its performance..." value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
      <button className="btn btn-primary" onClick={run} disabled={loading || !content.trim()} style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', marginBottom: result ? 16 : 0 }}>
        {loading ? '⏳ Predicting...' : <><TrendingUp size={14} /> Predict Performance</>}
      </button>
      {result && (
        <div>
          {result.performance && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: `${perfColor[result.performance] || '#6366f1'}15`, border: `1px solid ${perfColor[result.performance] || '#6366f1'}30`, borderRadius: 99, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: perfColor[result.performance] || '#6366f1', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: perfColor[result.performance] || '#6366f1' }}>Predicted: {result.performance}</span>
            </div>
          )}
          <MarkdownText content={result.result} />
        </div>
      )}
    </ToolCard>
  );
}

export default function Tools() {
  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛠️ AI Tools</h1>
          <p className="page-subtitle">Advanced content intelligence — risk scoring, A/B testing, tone customization, and performance prediction</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Risk Scoring', 'A/B Testing', 'Tone AI', 'Publish Timing', 'Performance AI'].map(k => (
            <span key={k} style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 99, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontWeight: 600 }}>{k}</span>
          ))}
        </div>
      </div>
      <RiskScorer />
      <ABTester />
      <ToneCustomizer />
      <PublishTimer />
      <PerformancePredictor />
    </div>
  );
}
