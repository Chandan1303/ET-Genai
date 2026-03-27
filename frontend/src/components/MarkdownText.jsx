/**
 * Lightweight markdown renderer for AI responses.
 * Handles: **bold**, *italic*, `code`, # headers, - bullet lists, numbered lists
 */
export default function MarkdownText({ content, style = {} }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines (add spacing)
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Headings: # through ######
    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const text = line.replace(/^#+\s+/, '');
      // h1-h2 = larger, h3-h4 = medium, h5-h6 = small (same as bold text)
      const sizes = { 1: 18, 2: 16, 3: 14, 4: 13.5, 5: 13, 6: 13 };
      const colors = { 1: '#a78bfa', 2: '#a78bfa', 3: '#818cf8', 4: '#c4b5fd', 5: 'var(--text-2)', 6: 'var(--text-2)' };
      elements.push(
        <div key={i} style={{ fontWeight: 700, fontSize: sizes[level] || 13.5, color: colors[level] || '#c4b5fd', marginTop: level <= 3 ? 14 : 10, marginBottom: 4 }}>
          {renderInline(text)}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list: - or *
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={i} style={{ margin: '6px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)', listStyleType: 'disc' }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list: 1. 2. etc
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={i} style={{ margin: '6px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Code block: ```
    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={i} style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', overflowX: 'auto',
          fontSize: 12.5, fontFamily: 'monospace', color: '#e2e8f0',
          margin: '8px 0', lineHeight: 1.6,
        }}>
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--text)', margin: '2px 0' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...style }}>{elements}</div>;
}

function renderInline(text) {
  // Split on **bold**, *italic*, `code`
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} style={{ fontWeight: 700, color: 'var(--text)' }}>{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index} style={{ fontStyle: 'italic', color: '#c4b5fd' }}>{match[3]}</em>);
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code key={match.index} style={{
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 4, padding: '1px 6px', fontSize: 12.5, fontFamily: 'monospace', color: '#a78bfa',
        }}>{match[4]}</code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
