export default function Logo({ size = 36, showText = true, textSize = 22 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* AgentFlow icon — interconnected nodes representing a pipeline */}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ag1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="ag2" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {/* Background rounded square */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#ag1)" opacity="0.15" />
        <rect x="2" y="2" width="44" height="44" rx="12" stroke="url(#ag1)" strokeWidth="1.5" fill="none" />

        {/* Node 1 — left */}
        <circle cx="10" cy="24" r="5" fill="url(#ag1)" />
        {/* Node 2 — center top */}
        <circle cx="24" cy="12" r="5" fill="url(#ag2)" />
        {/* Node 3 — center bottom */}
        <circle cx="24" cy="36" r="5" fill="url(#ag1)" />
        {/* Node 4 — right */}
        <circle cx="38" cy="24" r="5" fill="url(#ag2)" />

        {/* Connecting lines */}
        <line x1="15" y1="24" x2="19" y2="14" stroke="url(#ag1)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15" y1="24" x2="19" y2="34" stroke="url(#ag1)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="12" x2="33" y2="22" stroke="url(#ag2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="29" y1="36" x2="33" y2="26" stroke="url(#ag2)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Center spark */}
        <circle cx="24" cy="24" r="3" fill="white" opacity="0.9" />
        <circle cx="24" cy="24" r="5" fill="none" stroke="url(#ag1)" strokeWidth="1" opacity="0.5" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily: "'Nunito', 'Inter', sans-serif",
            fontWeight: 900,
            fontSize: textSize,
            background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
          }}>AgentFlow</span>
          <span style={{
            fontSize: 9,
            color: 'var(--text-3)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginTop: 2,
            fontWeight: 600,
          }}>AI Pipeline</span>
        </div>
      )}
    </div>
  );
}
