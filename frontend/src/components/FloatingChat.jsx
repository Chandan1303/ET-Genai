import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Trash2 } from 'lucide-react';
import api from '../api';
import MarkdownText from './MarkdownText';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the **AgentFlow AI Assistant**.\n\nI can help you with:\n- How the 7-agent pipeline works\n- Content strategy and writing tips\n- Compliance and brand governance\n- Localization and distribution\n- Analytics and performance insights\n\nWhat would you like to know? 🚀" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/chat', { message: userMsg.content });
      setMessages(data.history);
    } catch {
      setMessages(m => [...m, { role: 'error', content: 'AI unavailable. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const clear = async () => {
    try { await api.delete('/api/ai/chat/history'); } catch { /* silent */ }
    setMessages([{ role: 'assistant', content: "Chat cleared! Ask me anything about AgentFlow or content strategy. 🚀" }]);
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: open ? '#4f46e5' : 'linear-gradient(135deg,#8b5cf6,#6366f1)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(139,92,246,0.5)',
          transition: 'all 0.25s',
          transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat popup */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 999,
          width: 360, height: 500,
          background: 'var(--bg-2)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          boxShadow: 'var(--shadow)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.08)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={17} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>AI Content Assistant</div>
              <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Online
              </div>
            </div>
            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }} title="Clear chat">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'var(--surface)',
                  border: msg.role !== 'user' ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user' ? <User size={13} color="white" /> : <Bot size={13} color="#a78bfa" />}
                </div>
                <div style={{
                  maxWidth: '78%', padding: '9px 12px',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(139,92,246,0.35),rgba(99,102,241,0.3))' : 'var(--surface)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                  fontSize: 12.5,
                }}>
                  {msg.role === 'user'
                    ? <p style={{ color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
                    : <MarkdownText content={msg.content} style={{ fontSize: 12.5 }} />
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={13} color="#a78bfa" />
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
                </div>
              </div>
            )}
          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 0 8px' }}>
              {['What does AgentFlow do?', 'How does compliance work?', 'Explain the 7 agents', 'Tips for LinkedIn content'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>{s}</button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-2)' }}>
            <input
              placeholder="Ask about AgentFlow or content..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
              style={{ flex: 1, borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPop { from { opacity:0; transform:scale(0.85) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-4px);opacity:1} }
      `}</style>
    </>
  );
}
