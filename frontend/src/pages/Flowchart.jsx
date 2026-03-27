import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8b5cf6',
    primaryTextColor: '#f0f0ff',
    primaryBorderColor: '#6366f1',
    lineColor: '#a78bfa',
    secondaryColor: '#13132a',
    tertiaryColor: '#0e0e1f',
    background: '#080812',
    mainBkg: '#13132a',
    nodeBorder: '#6366f1',
    clusterBkg: '#0e0e1f',
    titleColor: '#f0f0ff',
    edgeLabelBackground: '#13132a',
    fontFamily: 'Inter, sans-serif',
  },
  flowchart: { curve: 'basis', padding: 20 },
});

function MermaidDiagram({ chart }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ref.current || !chart) return;
    setError(null);
    const id = `mermaid-${Date.now()}`;
    mermaid.render(id, chart)
      .then(({ svg }) => { if (ref.current) ref.current.innerHTML = svg; })
      .catch(e => { setError('Could not render diagram. The AI output may need adjustment.'); console.error(e); });
  }, [chart]);

  if (error) return (
    <div className="alert alert-warning" style={{ marginTop: 16 }}>
      ⚠️ {error}
      <pre style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', overflow: 'auto', maxHeight: 200 }}>{chart}</pre>
    </div>
  );

  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }} />;
}

export default function Flowchart() {
  const [topic, setTopic] = useState('');
  const [chart, setChart] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true); setChart('');
    try {
      const { data } = await api.post('/api/ai/flowchart', { topic });
      setChart(data.mermaid);
      setRawCode(data.mermaid);
      toast.success('Flowchart generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally { setLoading(false); }
  };

  const downloadSVG = () => {
    const svg = document.querySelector('.mermaid-output svg');
    if (!svg) return toast.error('No diagram to download');
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${topic}-flowchart.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const examples = ['Binary Search Algorithm', 'Water Cycle', 'How a Computer Boots', 'Database Normalization', 'Photosynthesis Process'];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Flowchart Generator</h1>
          <p className="page-subtitle">AI generates professional Mermaid.js flowcharts for any topic</p>
        </div>
      </div>

      <div className="glass card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <input placeholder="Enter topic (e.g. Binary Search Algorithm)" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} />
          <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '⏳ Generating...' : <><Sparkles size={14} /> Generate</>}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>Try:</span>
          {examples.map(ex => (
            <button key={ex} className="btn btn-ghost btn-sm" onClick={() => { setTopic(ex); }} style={{ fontSize: 12 }}>{ex}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <p style={{ color: 'var(--text-2)' }}>Generating flowchart...</p>
          <div className="skeleton" style={{ height: 6, width: 200, margin: '16px auto 0', borderRadius: 99 }} />
        </div>
      )}

      {chart && !loading && (
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>📊 {topic}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCode(s => !s)}>
                {showCode ? 'Hide Code' : 'Show Code'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={generate}>
                <RefreshCw size={13} /> Regenerate
              </button>
              <button className="btn btn-primary btn-sm" onClick={downloadSVG}>
                <Download size={13} /> Download SVG
              </button>
            </div>
          </div>

          <div className="mermaid-output" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '20px', overflow: 'auto', minHeight: 200 }}>
            <MermaidDiagram chart={chart} />
          </div>

          {showCode && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Mermaid Code</div>
              <textarea
                value={rawCode}
                onChange={e => { setRawCode(e.target.value); setChart(e.target.value); }}
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
