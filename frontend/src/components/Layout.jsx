import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, GitBranch, BarChart2, Wrench, Sun, Moon, LogOut, ChevronRight, Upload, Sparkles, CheckCircle, Edit3, Globe, Send } from 'lucide-react';
import FloatingChat from './FloatingChat';
import Logo from './Logo';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline',  icon: GitBranch,       label: 'Pipeline'  },
  { to: '/tools',     icon: Wrench,          label: 'AI Tools'  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: '100vh',
        background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 14px', position: 'sticky', top: 0, zIndex: 100, overflowY: 'auto',
      }}>
        <div style={{ padding: '4px 8px 28px' }}>
          <Logo size={36} textSize={18} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div className="section-label" style={{ padding: '0 10px', marginBottom: 8 }}>Navigation</div>
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div
                  className={active ? 'nav-active' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--radius-full)', marginBottom: 2,
                    background: active ? undefined : 'transparent',
                    border: '1px solid transparent',
                    color: active ? 'var(--purple-light)' : 'var(--text-2)',
                    fontWeight: active ? 600 : 400, fontSize: 13.5,
                    transition: 'var(--transition)', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                >
                  <Icon size={17} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pipeline stages quick reference */}
        <div style={{ marginTop: 16, padding: '12px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pipeline Stages</div>
          {[
            { icon: Upload,      label: 'Input',       color: '#8b5cf6' },
            { icon: Sparkles,    label: 'Content',     color: '#6366f1' },
            { icon: CheckCircle, label: 'Compliance',  color: '#f59e0b' },
            { icon: Edit3,       label: 'Review',      color: '#3b82f6' },
            { icon: Globe,       label: 'Localize',    color: '#10b981' },
            { icon: Send,        label: 'Distribute',  color: '#ec4899' },
            { icon: BarChart2,   label: 'Analytics',   color: '#f97316' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <s.icon size={13} color={s.color} />
              <span style={{ fontSize: 11.5, color: s.color, fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 16 }}>
          <div className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--success)' }}>● Active</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={toggle} style={{ justifyContent: 'flex-start', gap: 8, width: '100%' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleLogout} style={{ justifyContent: 'flex-start', gap: 8, width: '100%' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>

      <FloatingChat />
    </div>
  );
}
