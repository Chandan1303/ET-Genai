import { useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Upload, Sparkles, CheckCircle, XCircle, Edit3, Globe, Send, BarChart2, RefreshCw, Copy, Zap, FileText } from 'lucide-react';
import MarkdownText from '../components/MarkdownText';

const STAGES = [
  { id: 'input',      label: 'Input',      icon: Upload,      color: '#8b5cf6' },
  { id: 'content',    label: 'Content',    icon: Sparkles,    color: '#6366f1' },
  { id: 'compliance', label: 'Compliance', icon: CheckCircle, color: '#f59e0b' },
  { id: 'human',      label: 'Review',     icon: Edit3,       color: '#3b82f6' },
  { id: 'localize',   label: 'Localize',   icon: Globe,       color: '#10b981' },
  { id: 'distribute', label: 'Distribute', icon: Send,        color: '#ec4899' },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart2,   color: '#f97316' },
];

const KEYWORDS = [
  'Multi-agent pipeline', 'Human-in-the-loop', 'Compliance guardrails',
  'End-to-end automation', 'Audit trail', 'Content lifecycle automation',
];

function StageBar({ current }) {
  const idx = STAGES.findIndex(s => s.id === current);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0, paddingBottom: 2 }}>
        {STAGES.map((s, i) => {
          const done = i < idx; const active = i === idx;
          const Icon = s.icon;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 64 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: done ? s.color : active ? `${s.color}25` : 'transparent',
                  border: `2px solid ${done || active ? s.color : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 16px ${s.color}50` : 'none',
                  transition: 'all 0.35s',
                }}>
                  {done
                    ? <span style={{ fontSize: 16 }}>✓</span>
                    : <Icon size={16} color={active ? s.color : 'var(--text-3)'} />}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? s.color : done ? 'var(--text-2)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < idx ? `linear-gradient(90deg,${STAGES[i].color},${STAGES[i+1].color})` : 'var(--border)', marginBottom: 20, minWidth: 16, transition: 'background 0.4s' }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {KEYWORDS.map(k => (
          <span key={k} style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 99, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontWeight: 600 }}>{k}</span>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ icon: Icon, color, title, desc, children }) {
  return (
    <div className="glass card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color={color} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ResultCard({ title, content, color = '#8b5cf6' }) {
  const copy = () => { navigator.clipboard.writeText(content); toast.success('Copied!'); };
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={copy}><Copy size={12} /></button>
      </div>
      <MarkdownText content={content} />
    </div>
  );
}

function InputStage({ rawText, setRawText, loading, onRun, onFileRun }) {
  const [tab, setTab] = useState('text'); // 'text' | 'file'
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'var(--surface)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
        {[{ id: 'text', label: '📝 Paste Text' }, { id: 'file', label: '📁 Upload File' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: tab === t.id ? 700 : 400, background: tab === t.id ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'transparent', color: tab === t.id ? 'white' : 'var(--text-2)', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <>
          <textarea rows={8} placeholder="Paste your raw content here — article, notes, product info, document text..." value={rawText} onChange={e => setRawText(e.target.value)} style={{ marginBottom: 10, resize: 'vertical', fontSize: 13.5 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={onRun} disabled={loading || !rawText.trim()} style={{ flex: 1 }}>
              {loading ? '⏳ Processing...' : <><Zap size={14} /> Run Input Agent</>}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{rawText.length} chars</span>
          </div>
        </>
      )}

      {tab === 'file' && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ padding: '32px 20px', textAlign: 'center', cursor: 'pointer', border: `2px dashed ${dragging ? '#8b5cf6' : file ? '#10b981' : 'var(--border)'}`, background: dragging ? 'rgba(139,92,246,0.06)' : file ? 'rgba(16,185,129,0.04)' : 'var(--surface)', borderRadius: 12, marginBottom: 12, transition: 'all 0.2s' }}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
            {file ? (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#34d399' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={e => { e.stopPropagation(); setFile(null); }}>Remove</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>Drop file here or click to browse</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>PDF · DOCX · TXT · PNG/JPG · XLSX/CSV · Max 20MB</div>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => onFileRun(file)} disabled={loading || !file} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? '⏳ Extracting & Processing...' : <><Upload size={14} /> Extract & Run Input Agent</>}
          </button>
        </>
      )}
    </div>
  );
}

function AuditLog({ log }) {
  return (
    <div className="glass card" style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>📋</span> Audit Trail
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>{log.length} events</span>
      </div>
      {log.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>Pipeline logs will appear here as agents run...</p>
      ) : (
        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {log.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12, fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--text-3)', flexShrink: 0, fontSize: 11 }}>{e.time}</span>
              <span style={{ color: e.msg.includes('✓') ? '#34d399' : e.msg.includes('✗') ? '#f87171' : '#a78bfa' }}>{e.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pipeline() {
  const [stage, setStage] = useState('input');
  const [sessionId, setSessionId] = useState(null);
  const [rawText, setRawText] = useState('');
  const [inputResult, setInputResult] = useState('');
  const [contentResult, setContentResult] = useState('');
  const [complianceResult, setComplianceResult] = useState('');
  const [complianceApproved, setComplianceApproved] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [localizeResult, setLocalizeResult] = useState('');
  const [distributeResult, setDistributeResult] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState(['Kannada', 'Hindi']);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['LinkedIn', 'Email', 'Blog']);
  const [analyticsResult, setAnalyticsResult] = useState('');
  const [engagement, setEngagement] = useState({ likes: 0, clicks: 0, shares: 0 });
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [autoRun, setAutoRun] = useState(false);

  const addLog = (msg) => setLog(l => [...l, { time: new Date().toLocaleTimeString(), msg }]);

  const runInput = async () => {
    if (!rawText.trim()) return toast.error('Enter some content first');
    setLoading(true);
    addLog('🤖 Input Agent: Processing raw content...');
    try {
      const { data } = await api.post('/api/ai/agents/input', { rawText });
      setInputResult(data.result); setSessionId(data.sessionId); setEditedContent(data.result);
      setStage('content');
      addLog('🤖 Input Agent: Content structured successfully ✓');
      toast.success('Input processed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Input agent failed');
      addLog('🤖 Input Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const runInputFile = async (file) => {
    if (!file) return toast.error('Select a file first');
    setLoading(true);
    addLog(`🤖 Input Agent: Extracting text from ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/ai/agents/input-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setInputResult(data.result); setSessionId(data.sessionId); setEditedContent(data.result);
      setRawText(data.rawText || '');
      setStage('content');
      addLog(`🤖 Input Agent: File extracted & structured successfully ✓`);
      toast.success('File processed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'File processing failed');
      addLog('🤖 Input Agent: File extraction failed ✗');
    } finally { setLoading(false); }
  };

  const runContent = async () => {
    setLoading(true);
    addLog('✍️ Content Agent: Generating Blog, LinkedIn, Email, Product Desc...');
    try {
      const { data } = await api.post('/api/ai/agents/content', { sessionId, structuredContent: inputResult });
      setContentResult(data.result); setEditedContent(data.result);
      setStage('compliance');
      addLog('✍️ Content Agent: All 4 formats generated ✓');
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Content agent failed');
      addLog('✍️ Content Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const runCompliance = async () => {
    setLoading(true);
    addLog('⚖️ Compliance Agent: Checking tone, grammar, legal risks...');
    try {
      const { data } = await api.post('/api/ai/agents/compliance', { sessionId, content: contentResult });
      setComplianceResult(data.result); setComplianceApproved(data.approved);
      setStage('human');
      addLog(`⚖️ Compliance Agent: ${data.approved ? 'APPROVED ✓' : 'REJECTED — needs correction ✗'}`);
      toast[data.approved ? 'success' : 'error'](data.approved ? 'Compliance passed!' : 'Content needs revision');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Compliance agent failed');
      addLog('⚖️ Compliance Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const humanApprove = () => {
    addLog('👤 Human Review: Content APPROVED by reviewer ✓');
    setStage('localize');
    toast.success('Approved! Moving to localization.');
  };

  const humanReject = () => {
    addLog('👤 Human Review: Content REJECTED — returning to content generation ✗');
    setStage('content');
    toast.error('Rejected. Regenerate content.');
  };

  const runLocalize = async () => {
    if (selectedLanguages.length === 0) return toast.error('Select at least one language');
    setLoading(true);
    addLog(`Localization Agent: Translating to ${selectedLanguages.join(', ')}...`);
    try {
      const { data } = await api.post('/api/ai/agents/localize', { sessionId, content: editedContent || contentResult, languages: selectedLanguages });
      setLocalizeResult(data.result); setStage('distribute');
      addLog(`Localization Agent: ${selectedLanguages.join(' & ')} versions ready ✓`);
      toast.success('Localization complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Localization failed');
      addLog('Localization Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const runDistribute = async () => {
    if (selectedPlatforms.length === 0) return toast.error('Select at least one platform');
    setLoading(true);
    addLog(`Distribution Agent: Formatting for ${selectedPlatforms.join(', ')}...`);
    try {
      const { data } = await api.post('/api/ai/agents/distribute', { sessionId, content: editedContent || contentResult, platforms: selectedPlatforms });
      setDistributeResult(data.result); setStage('analytics');
      addLog(`Distribution Agent: ${selectedPlatforms.join(', ')} formats ready ✓`);
      toast.success('Distribution formats ready!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Distribution failed');
      addLog('Distribution Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const runAnalytics = async () => {
    setLoading(true);
    addLog('📊 Analytics Agent: Analyzing engagement data...');
    try {
      const { data } = await api.post('/api/ai/agents/analytics', { sessionId, engagementData: engagement });
      setAnalyticsResult(data.result);
      addLog('📊 Analytics Agent: Insights & suggestions generated ✓');
      addLog('🏁 Orchestrator: Pipeline complete — all 6 agents executed ✓');
      toast.success('Pipeline complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analytics failed');
      addLog('📊 Analytics Agent: Failed ✗');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setStage('input'); setSessionId(null); setRawText(''); setInputResult('');
    setContentResult(''); setComplianceResult(''); setComplianceApproved(null);
    setEditedContent(''); setLocalizeResult(''); setDistributeResult('');
    setSelectedLanguages(['Kannada', 'Hindi']); setSelectedPlatforms(['LinkedIn', 'Email', 'Blog']);
    setAnalyticsResult(''); setLog([]);
    toast.success('Pipeline reset');
  };

  const stageIdx = STAGES.findIndex(s => s.id === stage);
  const progress = Math.round((stageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔄 Multi-Agent Pipeline</h1>
          <p className="page-subtitle">Orchestrated content lifecycle automation — Input → Content → Compliance → Review → Localize → Distribute → Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Progress: <strong style={{ color: '#a78bfa' }}>{progress}%</strong></div>
          <button className="btn btn-ghost btn-sm" onClick={reset}><RefreshCw size={13} /> Reset</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: 20, height: 4 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <StageBar current={stage} />

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div>
          {stage === 'input' && (
            <AgentCard icon={Upload} color="#8b5cf6" title="Input Agent" desc="Clean and structure raw content from any source">
              <InputStage
                rawText={rawText} setRawText={setRawText}
                loading={loading} onRun={runInput} onFileRun={runInputFile}
              />
            </AgentCard>
          )}

          {stage === 'content' && (
            <AgentCard icon={Sparkles} color="#6366f1" title="Content Generation Agent" desc="Generate Blog, LinkedIn, Email & Product Description">
              <ResultCard title="Structured Input" content={inputResult} color="#8b5cf6" />
              <div className="alert alert-info" style={{ marginBottom: 14, fontSize: 12 }}>
                <Sparkles size={13} />
                <span>Will generate: Blog Post (300-500 words) · LinkedIn Post · Email Campaign · Product Description</span>
              </div>
              <button className="btn btn-primary" onClick={runContent} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                {loading ? '⏳ Generating 4 content formats...' : <><Sparkles size={14} /> Generate All Content Formats</>}
              </button>
            </AgentCard>
          )}

          {stage === 'compliance' && (
            <AgentCard icon={CheckCircle} color="#f59e0b" title="Compliance Agent" desc="Check tone, grammar, sensitive words, legal risks">
              <ResultCard title="Generated Content" content={contentResult.slice(0, 600) + (contentResult.length > 600 ? '\n...' : '')} color="#6366f1" />
              <div className="alert alert-warning" style={{ marginBottom: 14, fontSize: 12 }}>
                <span>⚖️</span>
                <span>Checking for: Tone issues · Grammar mistakes · Risky words (guaranteed, 100% safe) · Legal risks</span>
              </div>
              <button className="btn btn-primary" onClick={runCompliance} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {loading ? '⏳ Running compliance review...' : '⚖️ Run Compliance Check'}
              </button>
            </AgentCard>
          )}

          {stage === 'human' && (
            <AgentCard icon={Edit3} color="#3b82f6" title="Human-in-the-Loop Review" desc="Review compliance report, edit if needed, then approve or reject">
              <div className={`alert ${complianceApproved ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{complianceApproved ? '✅' : '⚠️'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Compliance Status: {complianceApproved ? 'APPROVED' : 'NEEDS REVISION'}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{complianceApproved ? 'Content passed all checks. You may approve.' : 'Issues found. Review and edit before approving.'}</div>
                </div>
              </div>
              <ResultCard title="Compliance Report" content={complianceResult} color="#f59e0b" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>✏️ Edit content before approving (optional):</div>
                <textarea rows={5} value={editedContent} onChange={e => setEditedContent(e.target.value)} style={{ resize: 'vertical', fontSize: 12.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" onClick={humanApprove} style={{ flex: 1, justifyContent: 'center' }}>
                  <CheckCircle size={15} /> ✅ Approve
                </button>
                <button className="btn btn-danger" onClick={humanReject} style={{ flex: 1, justifyContent: 'center' }}>
                  <XCircle size={15} /> ❌ Reject
                </button>
              </div>
            </AgentCard>
          )}

          {stage === 'localize' && (
            <AgentCard icon={Globe} color="#10b981" title="Localization Agent" desc="Translate and culturally adapt to selected languages">
              <div className="alert alert-success" style={{ marginBottom: 14 }}>
                <span>✓</span><span>Human approved. Select languages and localize.</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Languages</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Kannada', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali'].map(lang => {
                    const sel = selectedLanguages.includes(lang);
                    return (
                      <button key={lang} onClick={() => setSelectedLanguages(s => sel ? s.filter(l => l !== lang) : [...s, lang])}
                        style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${sel ? '#10b981' : 'var(--border)'}`, background: sel ? 'rgba(16,185,129,0.15)' : 'var(--surface)', color: sel ? '#4CAF50' : 'var(--text-2)', fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {sel ? '✓ ' : ''}{lang}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button className="btn btn-primary" onClick={runLocalize} disabled={loading || selectedLanguages.length === 0} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                {loading ? '⏳ Translating...' : <><Globe size={14} /> Localize to {selectedLanguages.length > 0 ? selectedLanguages.join(' & ') : 'selected languages'}</>}
              </button>
            </AgentCard>
          )}

          {stage === 'distribute' && (
            <AgentCard icon={Send} color="#ec4899" title="Distribution Agent" desc="Format for selected publishing platforms">
              <ResultCard title="Localized Content" content={localizeResult.slice(0, 500) + (localizeResult.length > 500 ? '\n...' : '')} color="#10b981" />
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Platforms</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['LinkedIn', 'Email', 'Blog', 'Twitter', 'Instagram'].map(p => {
                    const sel = selectedPlatforms.includes(p);
                    return (
                      <button key={p} onClick={() => setSelectedPlatforms(s => sel ? s.filter(x => x !== p) : [...s, p])}
                        style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${sel ? '#ec4899' : 'var(--border)'}`, background: sel ? 'rgba(236,72,153,0.15)' : 'var(--surface)', color: sel ? '#f472b6' : 'var(--text-2)', fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {sel ? '✓ ' : ''}{p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button className="btn btn-primary" onClick={runDistribute} disabled={loading || selectedPlatforms.length === 0} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
                {loading ? '⏳ Formatting...' : <><Send size={14} /> Format for {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'selected platforms'}</>}
              </button>
            </AgentCard>
          )}

          {stage === 'analytics' && (
            <AgentCard icon={BarChart2} color="#f97316" title="Analytics Agent" desc="Analyze engagement data and generate improvement insights">
              <ResultCard title="Distribution Formats" content={distributeResult.slice(0, 400) + (distributeResult.length > 400 ? '\n...' : '')} color="#ec4899" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[{ k: 'likes', label: 'Likes', color: '#8b5cf6' }, { k: 'clicks', label: 'Clicks', color: '#6366f1' }, { k: 'shares', label: 'Shares', color: '#10b981' }].map(({ k, label, color }) => (
                  <div key={k} style={{ textAlign: 'center', padding: '12px 8px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    <input type="number" min={0} value={engagement[k]} onChange={e => setEngagement(g => ({ ...g, [k]: Number(e.target.value) }))} style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '4px', background: 'transparent', border: 'none', borderBottom: `1px solid ${color}40`, borderRadius: 0, width: '100%' }} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={runAnalytics} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#f97316,#ea580c)', marginBottom: analyticsResult ? 16 : 0 }}>
                {loading ? '⏳ Analyzing...' : <><BarChart2 size={14} /> Run Analytics Agent</>}
              </button>
              {analyticsResult && <ResultCard title="Analytics Report" content={analyticsResult} color="#f97316" />}
            </AgentCard>
          )}
        </div>

        {/* Right panel */}
        <div>
          <AuditLog log={log} />
          {contentResult && !['content', 'compliance'].includes(stage) && (
            <div className="glass card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📄</span> Generated Content Preview
              </div>
              <MarkdownText content={contentResult.slice(0, 500) + (contentResult.length > 500 ? '\n...' : '')} />
            </div>
          )}
          {analyticsResult && (
            <div className="glass card" style={{ marginTop: 16, borderTop: '3px solid #10b981' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#34d399' }}>🏁 Pipeline Complete!</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>All 6 agents executed successfully. Content has been processed, compliance-checked, human-approved, localized, distributed, and analyzed.</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={reset}><RefreshCw size={13} /> Start New Pipeline</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
