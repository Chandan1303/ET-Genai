import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Upload } from 'lucide-react';

function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(false);

  return (
    <div style={{ perspective: 1000, width: '100%', maxWidth: 560, margin: '0 auto' }}>
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          position: 'relative', width: '100%', height: 280, cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Front */}
        <div className="glass-strong" style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px', borderRadius: 20, textAlign: 'center',
          borderTop: '3px solid var(--purple)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Question {index + 1} of {total}</div>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6, color: 'var(--text)' }}>{card.question}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>Click to reveal answer</p>
        </div>

        {/* Back */}
        <div className="glass-strong" style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px', borderRadius: 20, textAlign: 'center',
          background: 'rgba(139,92,246,0.08)',
          borderTop: '3px solid var(--success)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Answer</div>
          <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.7, color: 'var(--text)' }}>{card.answer}</p>
        </div>
      </div>

      {/* Known button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          className={`btn ${known ? 'btn-success' : 'btn-ghost'} btn-sm`}
          onClick={e => { e.stopPropagation(); setKnown(k => !k); }}
        >
          <Check size={14} /> {known ? 'Marked as Known ✓' : 'Mark as Known'}
        </button>
      </div>
    </div>
  );
}

export default function Flashcards() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('topic'); // 'topic' | 'file'
  const [file, setFile] = useState(null);

  const generateFromTopic = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true); setCards([]); setCurrent(0);
    try {
      const { data } = await api.post('/api/ai/flashcards', { topic, count: 10 });
      setCards(data.flashcards);
      toast.success(`${data.count} flashcards generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally { setLoading(false); }
  };

  const generateFromFile = async () => {
    if (!file) return toast.error('Select a file first');
    setLoading(true); setCards([]); setCurrent(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/api/ai/upload/flashcards', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCards(data.flashcards);
      toast.success(`${data.count} flashcards generated from file!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'File processing failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧠 Flashcards</h1>
          <p className="page-subtitle">AI-generated flip cards for active recall learning</p>
        </div>
      </div>

      {/* Generator */}
      <div className="glass card" style={{ marginBottom: 28 }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['topic', 'file'].map(m => (
            <button key={m} className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setMode(m)}>
              {m === 'topic' ? '✏️ From Topic' : '📂 From File'}
            </button>
          ))}
        </div>

        {mode === 'topic' ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Enter topic (e.g. Photosynthesis, French Revolution)" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateFromTopic()} />
            <button className="btn btn-primary" onClick={generateFromTopic} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? '⏳ Generating...' : <><Sparkles size={14} /> Generate</>}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> {file ? file.name : 'Choose File (PDF, DOCX, TXT, Image)'}
              <input type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-primary" onClick={generateFromFile} disabled={loading || !file} style={{ whiteSpace: 'nowrap' }}>
              {loading ? '⏳ Processing...' : <><Sparkles size={14} /> Generate from File</>}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
          <p style={{ color: 'var(--text-2)' }}>Generating flashcards...</p>
          <div className="skeleton" style={{ height: 6, width: 200, margin: '16px auto 0', borderRadius: 99 }} />
        </div>
      )}

      {/* Flashcard viewer */}
      {cards.length > 0 && !loading && (
        <div>
          <FlipCard card={cards[current]} index={current} total={cards.length} key={current} />

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 80, textAlign: 'center' }}>
              {current + 1} / {cards.length}
            </span>
            <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.min(cards.length - 1, c + 1))} disabled={current === cards.length - 1}>
              Next <ChevronRight size={16} />
            </button>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            {cards.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === current ? 'var(--purple)' : 'var(--border)', transition: 'var(--transition)', padding: 0 }} />
            ))}
          </div>

          {/* Restart */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCurrent(0); }}>
              <RotateCcw size={13} /> Restart
            </button>
          </div>

          {/* All cards list */}
          <div className="glass card" style={{ marginTop: 28 }}>
            <h2 className="card-title">All Flashcards</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {cards.map((card, i) => (
                <div key={card.id} className="glass" style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: `3px solid ${i === current ? 'var(--purple)' : 'transparent'}` }} onClick={() => setCurrent(i)}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Card {i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{card.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{card.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
