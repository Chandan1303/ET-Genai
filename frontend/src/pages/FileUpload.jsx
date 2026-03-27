import { useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Upload, FileText, FileSpreadsheet, Image, File, Sparkles, Copy } from 'lucide-react';
import MarkdownText from '../components/MarkdownText';

const ACCEPTED = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv';

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText size={20} color="#ef4444" />;
  if (['xlsx','csv','xls'].includes(ext)) return <FileSpreadsheet size={20} color="#10b981" />;
  if (['png','jpg','jpeg','webp'].includes(ext)) return <Image size={20} color="#3b82f6" />;
  return <File size={20} color="#8b5cf6" />;
}

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [action, setAction] = useState('summarize');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const process = async () => {
    if (!file) return toast.error('Select a file first');
    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = action === 'summarize' ? '/api/ai/upload/summarize'
        : action === 'flashcards' ? '/api/ai/upload/flashcards'
        : '/api/ai/upload/quiz-from-file';

      const { data } = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult({ type: action, data });
      toast.success('File processed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'File processing failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📂 File AI Processor</h1>
          <p className="page-subtitle">Upload PDF, Excel, DOCX, images — AI extracts and processes content</p>
        </div>
      </div>

      {/* Supported formats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { icon: '📄', label: 'PDF', color: '#ef4444' },
          { icon: '📊', label: 'Excel / CSV', color: '#10b981' },
          { icon: '📝', label: 'Word / TXT', color: '#8b5cf6' },
          { icon: '🖼️', label: 'Images (OCR)', color: '#3b82f6' },
        ].map(f => (
          <div key={f.label} className="glass" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span>{f.icon}</span>
            <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Upload area */}
        <div>
          <div
            className="glass"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
              border: `2px dashed ${dragging ? 'var(--purple)' : file ? 'var(--success)' : 'var(--border)'}`,
              background: dragging ? 'rgba(139,92,246,0.08)' : file ? 'rgba(16,185,129,0.05)' : 'var(--surface)',
              borderRadius: 16, transition: 'var(--transition)',
            }}
          >
            <input ref={inputRef} type="file" accept={ACCEPTED} onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />

            {file ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <FileIcon name={file.name} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{file.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}>
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload size={36} color="var(--text-3)" style={{ marginBottom: 16 }} />
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Drop file here or click to browse</p>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>PDF, DOCX, TXT, PNG, JPG, XLSX, CSV · Max 20MB</p>
              </div>
            )}
          </div>

          {/* Action selector */}
          {file && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>What to generate?</div>
              {[
                { value: 'summarize', label: '📝 Summary', desc: 'Bullet-point summary of content' },
                { value: 'flashcards', label: '🧠 Flashcards', desc: '10 Q&A flashcards from content' },
                { value: 'quiz', label: '❓ Quiz', desc: '5 MCQ questions from content' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: action === opt.value ? 'rgba(139,92,246,0.1)' : 'transparent', border: `1px solid ${action === opt.value ? 'rgba(139,92,246,0.3)' : 'transparent'}`, marginBottom: 8, transition: 'var(--transition)' }}>
                  <input type="radio" name="action" value={opt.value} checked={action === opt.value} onChange={() => setAction(opt.value)} style={{ width: 'auto', accentColor: '#8b5cf6' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}

              <button className="btn btn-primary" onClick={process} disabled={loading} style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
                {loading
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Processing...</>
                  : <><Sparkles size={15} /> Process File</>}
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        <div>
          {loading && (
            <div className="glass card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
              <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>Processing your file...</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 8 }}>Extracting text and running AI analysis</p>
              {[100,80,90,70,85].map((w,i) => <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, margin: '10px auto 0', borderRadius: 6 }} />)}
            </div>
          )}

          {result && !loading && (
            <div className="glass card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>
                  {result.type === 'summarize' ? '📝 Summary' : result.type === 'flashcards' ? '🧠 Flashcards' : '❓ Quiz'}
                </h2>
                {result.type === 'summarize' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(result.data.summary?.join('\n') || ''); toast.success('Copied!'); }}>
                    <Copy size={13} /> Copy
                  </button>
                )}
              </div>

              {result.type === 'summarize' && (
                <div>
                  {result.data.charCount && <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>Extracted {result.data.charCount.toLocaleString()} characters from file</p>}
                  {result.data.summary?.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', marginTop: 7, flexShrink: 0 }} />
                      <MarkdownText content={b.replace(/^[•\-]\s*/, '')} />
                    </div>
                  ))}
                </div>
              )}

              {result.type === 'flashcards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.data.flashcards?.map((card, i) => (
                    <div key={i} className="glass" style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6 }}>Q{i + 1}</div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{card.question}</div>
                      <div style={{ fontSize: 13, color: 'var(--success)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>→ {card.answer}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.type === 'quiz' && (
                <MarkdownText content={result.data.quiz} />
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="glass card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
              <p style={{ color: 'var(--text-2)', fontSize: 15, fontWeight: 600 }}>Upload a file to get started</p>
              <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>AI will extract text and generate summaries, flashcards, or quizzes</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
