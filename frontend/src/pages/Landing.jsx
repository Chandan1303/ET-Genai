import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap, Globe, CheckCircle, BarChart2, MessageCircle } from 'lucide-react';
import Logo from '../components/Logo';

const agents = [
  { icon: '🤖', color: '#8b5cf6', title: 'Input Agent',        desc: 'Cleans and structures raw content from any source — PDFs, notes, articles.' },
  { icon: '✍️', color: '#6366f1', title: 'Content Agent',       desc: 'Generates Blog posts, LinkedIn posts, Email campaigns, and Product descriptions.' },
  { icon: '⚖️', color: '#f59e0b', title: 'Compliance Agent',    desc: 'Reviews tone, grammar, sensitive words, and legal/ethical risks automatically.' },
  { icon: '👤', color: '#3b82f6', title: 'Human-in-the-Loop',   desc: 'Approve, reject, or edit content before it moves forward in the pipeline.' },
  { icon: '🌍', color: '#10b981', title: 'Localization Agent',  desc: 'Translates and culturally adapts content into Kannada and Hindi.' },
  { icon: '📢', color: '#ec4899', title: 'Distribution Agent',  desc: 'Formats content for LinkedIn, Email, and Blog with platform-specific optimization.' },
  { icon: '📊', color: '#f97316', title: 'Analytics Agent',     desc: 'Analyzes engagement data and suggests improvements for future content.' },
];

const stats = [
  { value: '7',     label: 'AI Agents' },
  { value: '4',     label: 'Content Formats' },
  { value: '2',     label: 'Languages' },
  { value: '100%',  label: 'Automated' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 48px', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,18,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Logo size={34} textSize={19} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login"><button className="btn btn-ghost">Sign In</button></Link>
          <Link to="/login"><button className="btn btn-primary">Get Started <ArrowRight size={14} /></button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div className="badge badge-purple animate-in" style={{ marginBottom: 24, fontSize: 12.5, padding: '5px 14px' }}>
          <Sparkles size={12} /> Multi-Agent Content Pipeline · Powered by Hugging Face
        </div>
        <h1 className="animate-up" style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-2px' }}>
          Automate Your<br />
          <span className="gradient-text">Content Lifecycle</span>
        </h1>
        <p className="animate-up" style={{ fontSize: 18, color: 'var(--text-2)', lineHeight: 1.75, marginBottom: 44, maxWidth: 640, margin: '0 auto 44px', animationDelay: '0.1s' }}>
          A 7-agent AI pipeline that takes raw content from input to compliance-checked, localized, and platform-ready output — with human-in-the-loop control at every step.
        </p>
        <div className="animate-up" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.2s' }}>
          <Link to="/login">
            <button className="btn btn-primary btn-lg">Launch Pipeline <ArrowRight size={16} /></button>
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-3)' }}>No credit card required · All 7 agents included</p>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 48px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div className="grid-4">
          {stats.map(s => (
            <div key={s.label} className="glass-strong" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px' }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline flow */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label" style={{ justifyContent: 'center', display: 'flex', marginBottom: 12 }}>The Pipeline</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-1px' }}>
            7 Agents. <span className="gradient-text">One Pipeline.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          {agents.map(({ icon, color, title, desc }, i) => (
            <div key={title} className="glass card" style={{ borderTop: `3px solid ${color}`, transition: 'var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agent {i + 1}</div>
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 14.5 }}>{title}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Keywords */}
      <section style={{ padding: '0 48px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div className="glass-strong" style={{ padding: '28px 36px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { icon: Shield,       text: 'Compliance Guardrails' },
            { icon: Zap,          text: 'End-to-end Automation' },
            { icon: CheckCircle,  text: 'Human-in-the-Loop' },
            { icon: Globe,        text: 'Multi-language Support' },
            { icon: BarChart2,    text: 'Audit Trail' },
            { icon: MessageCircle, text: 'AI Assistant' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 13.5 }}>
              <Icon size={16} color="var(--purple-light)" />{text}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '0 24px 100px' }}>
        <div className="glass-strong" style={{ maxWidth: 560, margin: '0 auto', padding: '56px 40px' }}>
          <Logo size={48} textSize={26} style={{ justifyContent: 'center', marginBottom: 24 }} />
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px' }}>Ready to automate your content?</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 32, fontSize: 15 }}>Multi-agent pipeline with compliance guardrails and human-in-the-loop approval.</p>
          <Link to="/login">
            <button className="btn btn-primary btn-lg">Get Started Free <ArrowRight size={16} /></button>
          </Link>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: 12.5, borderTop: '1px solid var(--border)' }}>
      © 2025 AgentFlow — Multi-Agent Pipeline · Powered by Hugging Face
      </footer>
    </div>
  );
}
