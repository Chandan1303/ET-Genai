import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { FileText, HelpCircle, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

function SectionHeader({ icon: Icon, color, title, desc, open, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: open ? 20 : 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{desc}</div>
        </div>
        {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
      </div>
    </button>
  );
}

function Summarizer() {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const [bullets, setBullets] = useState([]);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    if (text.trim().length < 50) return toast.error('Text must be at least 50 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/summarize', { text });
      setBullets(data.summary);
      toast.success('Summary generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Summarization failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="glass card">
      <SectionHeader icon={FileText} color="#8b5cf6" title="AI Summarizer" desc="Convert notes into concise bullet-point summaries" open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="animate-up">
          <textarea rows={6} placeholder="Paste your notes here (minimum 50 characters)..." value={text} onChange={e => setText(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: text.length < 50 ? 'var(--danger)' : 'var(--success)' }}>
              {text.length < 50 ? `${50 - text.length} more characters needed` : `✓ ${text.length} characters`}
            </span>
            <button className="btn btn-primary" onClick={summarize} disabled={loading || text.length < 50}>
              {loading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Summarizing...</> : <><Sparkles size={14} /> Summarize</>}
            </button>
          </div>
          {loading && <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 18, marginBottom: 10, width: `${[100,80,90][i-1]}%` }} />)}</div>}
          {bullets.length > 0 && !loading && (
            <div className="glass" style={{ padding: '18px 20px', borderLeft: '3px solid var(--purple)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Key Points</div>
              {bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', marginTop: 7, flexShrink: 0 }} />
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text)' }}>{b.replace(/^[•\-]\s*/, '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MCQQuestion({ q, i, answers, setAnswers, result }) {
  return (
    <div className="glass" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
        <span style={{ color: 'var(--purple-light)', marginRight: 8 }}>{i + 1}.</span>{q.question}
      </p>
      {q.options && q.options.length > 0 ? q.options.map(opt => {
        const isCorrect = result && opt.label === q.answer;
        const isWrong   = result && answers[q.id] === opt.label && opt.label !== q.answer;
        return (
          <label key={opt.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
            cursor: result ? 'default' : 'pointer', padding: '9px 12px', borderRadius: 8,
            background: isCorrect ? 'rgba(16,185,129,0.12)' : isWrong ? 'rgba(239,68,68,0.1)' : answers[q.id] === opt.label ? 'rgba(139,92,246,0.1)' : 'transparent',
            border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.35)' : isWrong ? 'rgba(239,68,68,0.3)' : answers[q.id] === opt.label ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
            transition: 'var(--transition)',
          }}>
            <input type="radio" name={q.id} value={opt.label}
              checked={answers[q.id] === opt.label}
              onChange={() => !result && setAnswers(a => ({ ...a, [q.id]: opt.label }))}
              style={{ width: 'auto', accentColor: '#8b5cf6' }} disabled={!!result} />
            <span style={{ fontSize: 13.5, color: isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--text)', flex: 1 }}>
              <strong style={{ marginRight: 8, color: 'var(--purple-light)' }}>{opt.label}.</strong>{opt.text}
            </span>
            {isCorrect && <span style={{ fontSize: 16 }}>✅</span>}
            {isWrong   && <span style={{ fontSize: 16 }}>❌</span>}
          </label>
        );
      }) : <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Options not available</p>}
      {result && (
        <p style={{ fontSize: 12, marginTop: 10, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, color: 'var(--text-2)' }}>
          Correct answer: <strong style={{ color: 'var(--success)' }}>{q.answer}</strong>
        </p>
      )}
    </div>
  );
}

function OneWordQuestion({ q, i, answers, setAnswers, result }) {
  const userAns = (answers[q.id] || '').trim().toLowerCase();
  const correctAns = (q.answer || '').trim().toLowerCase();
  const isCorrect = result && userAns === correctAns;
  const isWrong   = result && userAns !== correctAns;
  return (
    <div className="glass" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
        <span style={{ color: 'var(--purple-light)', marginRight: 8 }}>{i + 1}.</span>{q.question}
      </p>
      <input
        placeholder="Type your answer..."
        value={answers[q.id] || ''}
        onChange={e => !result && setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
        disabled={!!result}
        style={{
          maxWidth: 360,
          background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.08)' : undefined,
          borderColor: isCorrect ? 'rgba(16,185,129,0.4)' : isWrong ? 'rgba(239,68,68,0.4)' : undefined,
        }}
      />
      {result && (
        <p style={{ fontSize: 12, marginTop: 10, padding: '6px 10px', background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
          {isCorrect ? '✅ Correct!' : <>❌ Correct answer: <strong style={{ color: 'var(--success)' }}>{q.answer}</strong></>}
        </p>
      )}
    </div>
  );
}

function MatchQuestion({ q, answers, setAnswers, result }) {
  if (!q.left || !q.right) return null;
  return (
    <div className="glass" style={{ padding: '18px 20px', marginBottom: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--purple-light)' }}>Match the Following</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left column — terms */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Terms</div>
          {q.left.map((item, idx) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--purple-light)', flexShrink: 0 }}>{item.key}</span>
              <span style={{ fontSize: 13.5 }}>{item.text}</span>
            </div>
          ))}
        </div>
        {/* Right column — definitions with dropdowns */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Match with</div>
          {q.left.map((item, idx) => {
            const correctRightKey = q.answer?.[item.key];
            const userVal = answers[`match_${q.id}_${item.key}`] || '';
            const isCorrect = result && userVal === correctRightKey;
            const isWrong   = result && userVal !== correctRightKey;
            return (
              <div key={item.key} style={{ marginBottom: 10 }}>
                <select
                  value={userVal}
                  onChange={e => !result && setAnswers(a => ({ ...a, [`match_${q.id}_${item.key}`]: e.target.value }))}
                  disabled={!!result}
                  style={{
                    background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.08)' : undefined,
                    borderColor: isCorrect ? 'rgba(16,185,129,0.4)' : isWrong ? 'rgba(239,68,68,0.4)' : undefined,
                    fontSize: 13,
                  }}
                >
                  <option value="">-- Select --</option>
                  {q.right.map(r => (
                    <option key={r.key} value={r.key}>{r.key}. {r.text}</option>
                  ))}
                </select>
                {result && isWrong && (
                  <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 3 }}>
                    ✓ Correct: {q.right.find(r => r.key === correctRightKey)?.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizGenerator() {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({ topic: '', type: 'mcq' });
  const [quiz, setQuiz] = useState(null);
  const [quizType, setQuizType] = useState('mcq');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizId, setQuizId] = useState(null);

  const generate = async () => {
    if (!form.topic.trim()) return toast.error('Enter a topic');
    setLoading(true); setQuiz(null); setResult(null); setAnswers({});
    try {
      const { data } = await api.post('/api/ai/quiz', form);
      setQuiz(data.questions);
      setQuizType(data.type);
      setQuizId(data.quizId);
      toast.success('Quiz generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Quiz generation failed');
    } finally { setLoading(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/ai/quiz/submit', { quizId, answers });
      setResult(data);
      toast.success(`Score: ${data.score}%`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="glass card">
      <SectionHeader icon={HelpCircle} color="#6366f1" title="Quiz Generator" desc="Generate MCQ, one-word, or match-the-following quizzes" open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="animate-up">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input placeholder="Topic (e.g. Photosynthesis, World War II)" value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && generate()}
              style={{ flex: 1, minWidth: 200 }} />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: 160 }}>
              <option value="mcq">MCQ</option>
              <option value="one-word">One Word</option>
              <option value="match">Match the Following</option>
            </select>
            <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading
                ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</>
                : <><Sparkles size={14} /> Generate Quiz</>}
            </button>
          </div>

          {loading && <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 12, borderRadius: 10 }} />)}</div>}

          {quiz && !loading && (
            <div>
              {/* Badge showing quiz type */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${quizType === 'mcq' ? 'badge-purple' : quizType === 'one-word' ? 'badge-blue' : 'badge-yellow'}`}>
                  {quizType === 'mcq' ? '🔘 Multiple Choice' : quizType === 'one-word' ? '✏️ One Word' : '🔗 Match the Following'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{quiz.length} question{quiz.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Render questions by type */}
              {quizType === 'mcq' && quiz.map((q, i) => (
                <MCQQuestion key={q.id} q={q} i={i} answers={answers} setAnswers={setAnswers} result={result} />
              ))}

              {quizType === 'one-word' && quiz.map((q, i) => (
                <OneWordQuestion key={q.id} q={q} i={i} answers={answers} setAnswers={setAnswers} result={result} />
              ))}

              {quizType === 'match' && quiz.map(q => (
                <MatchQuestion key={q.id} q={q} answers={answers} setAnswers={setAnswers} result={result} />
              ))}

              {/* Submit button */}
              {!result && (
                <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ marginTop: 8 }}>
                  {submitting ? 'Submitting...' : 'Submit Quiz ✓'}
                </button>
              )}

              {/* Score card */}
              {result && (
                <div className="glass" style={{ padding: '20px 24px', marginTop: 12, borderTop: `3px solid ${result.score >= 70 ? 'var(--success)' : result.score >= 50 ? 'var(--warning)' : 'var(--danger)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: result.score >= 70 ? 'var(--success)' : result.score >= 50 ? 'var(--warning)' : 'var(--danger)', letterSpacing: '-1px' }}>{result.score}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{result.correct}/{result.total} correct</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div className="progress-bar" style={{ marginBottom: 10 }}>
                        <div className="progress-fill" style={{ width: `${result.score}%`, background: result.score >= 70 ? 'var(--success)' : result.score >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                        {result.score >= 70 ? '🎉 Great job! Keep it up.' : result.score >= 50 ? '📚 Good effort. Review the missed questions.' : '💪 Keep practicing — you\'ll get there!'}
                      </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setQuiz(null); setResult(null); setAnswers({}); }}>
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeakTopicAnalyzer() {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/weak-topics');
      setData(data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="glass card">
      <SectionHeader icon={AlertTriangle} color="#f59e0b" title="Weak Topic Analyzer" desc="AI identifies your weak areas from quiz performance" open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="animate-up">
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
            Analyzes your complete quiz history to identify topics needing improvement and generates a personalized improvement plan.
          </p>
          <button className="btn btn-primary" onClick={analyze} disabled={loading}>
            {loading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analyzing...</> : '🔍 Analyze My Performance'}
          </button>

          {loading && <div style={{ marginTop: 16 }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10 }} />)}</div>}

          {data && !loading && (
            <div style={{ marginTop: 20 }}>
              <div className="grid-3" style={{ gap: 12, marginBottom: 20 }}>
                {data.weak?.length > 0 && (
                  <div className="glass" style={{ padding: '14px 16px', borderTop: '3px solid var(--danger)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔴 Weak</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{data.weak.map(t => <span key={t} className="badge badge-red">{t}</span>)}</div>
                  </div>
                )}
                {data.moderate?.length > 0 && (
                  <div className="glass" style={{ padding: '14px 16px', borderTop: '3px solid var(--warning)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟡 Moderate</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{data.moderate.map(t => <span key={t} className="badge badge-yellow">{t}</span>)}</div>
                  </div>
                )}
                {data.strong?.length > 0 && (
                  <div className="glass" style={{ padding: '14px 16px', borderTop: '3px solid var(--success)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟢 Strong</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{data.strong.map(t => <span key={t} className="badge badge-green">{t}</span>)}</div>
                  </div>
                )}
              </div>
              {data.improvements && (
                <div className="alert alert-info">
                  <span>💡</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>Improvement Plan</div>
                    <p style={{ fontSize: 13, lineHeight: 1.65 }}>{data.improvements}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AITools() {
  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Tools</h1>
          <p className="page-subtitle">Summarize notes, generate quizzes, and analyze your performance</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Summarizer />
        <QuizGenerator />
        <WeakTopicAnalyzer />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
