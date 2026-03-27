import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, Trash2, Bot, User, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import MarkdownText from '../components/MarkdownText';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/api/ai/chat/history').then(r => {
      if (r.data.history?.length) setMessages(r.data.history);
      else setMessages([{ role: 'assistant', content: "Hi! I'm your AI Content Pipeline Assistant. I can help you with content strategy, compliance guidelines, localization tips, distribution best practices, and analytics insights. What would you like to know? 🚀" }]);
    }).catch(() => {
      setMessages([{ role: 'assistant', content: "Hi! I'm your AI Content Pipeline Assistant. Ask me anything about content generation, compliance, or distribution! 🚀" }]);
    });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/chat', { message: userMsg.content });
      setMessages(data.history);
    } catch (err) {
      setMessages(m => [...m, { role: 'error', content: err.response?.data?.error || 'AI tutor is temporarily unavailable. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/api/ai/chat/history');
      setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you study today? 🎓" }]);
      toast.success('Chat history cleared');
    } catch { toast.error('Failed to clear history'); }
  };

  const suggestions = ['How does the compliance agent work?', 'Tips for LinkedIn content', 'What makes content go viral?', 'How to localize content effectively'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,18,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
          <Bot size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>AI Content Assistant</div>
          <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Content Pipeline Expert
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{messages.filter(m => m.role !== 'error').length} messages</span>
          <button className="btn btn-ghost btn-sm" onClick={clearHistory}>
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, textAlign: 'center' }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map(s => (
                <button key={s} className="btn btn-ghost btn-sm" onClick={() => { setInput(s); }} style={{ fontSize: 12.5 }}>
                  <Sparkles size={12} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease both' }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : msg.role === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              border: msg.role === 'assistant' ? '1px solid var(--border-strong)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color={msg.role === 'error' ? '#f87171' : '#a78bfa'} />}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '72%',
              padding: '13px 17px',
              borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg,rgba(139,92,246,0.35),rgba(99,102,241,0.3))'
                : msg.role === 'error'
                ? 'rgba(239,68,68,0.08)'
                : 'var(--surface)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(139,92,246,0.3)' : msg.role === 'error' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
            }}>
              {msg.role === 'user' || msg.role === 'error'
                ? <p style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: msg.role === 'error' ? '#f87171' : 'var(--text)', margin: 0 }}>{msg.content}</p>
                : <MarkdownText content={msg.content} />
              }
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#a78bfa" />
            </div>
            <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', background: 'rgba(8,8,18,0.6)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 900, margin: '0 auto' }}>
          <input
            placeholder="Ask about content strategy, compliance, localization..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
            style={{ flex: 1, borderRadius: 12, padding: '12px 16px' }}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()} style={{ padding: '12px 18px', borderRadius: 12 }}>
            <Send size={16} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginTop: 10 }}>Press Enter to send · AI responses may take a few seconds</p>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
