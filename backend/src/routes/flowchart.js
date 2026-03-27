import { Router } from 'express';
import { callMistral } from '../services/hf.js';

const router = Router();

function sanitizeLabel(label) {
  // Replace special characters that break Mermaid v11 parsing
  return label
    .replace(/°/g, ' deg')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/&/g, 'and')
    .replace(/[<>]/g, '')
    .replace(/[^\x20-\x7E]/g, '') // strip non-ASCII
    .trim();
}

function cleanMermaidSyntax(code) {
  const lines = code.split('\n');
  const cleaned = [];

  for (let line of lines) {
    // Remove invalid {} appended to node definitions like A[Label]{}
    line = line.replace(/(\[[^\]]+\])\{\}/g, '$1');
    line = line.replace(/(\([^)]+\))\{\}/g, '$1');

    // Remove incomplete arrow lines (lines ending with -- or --> with no target)
    if (/--+\s*$/.test(line)) continue;

    // Sanitize labels inside [] brackets
    line = line.replace(/\[([^\]]+)\]/g, (_, label) => `[${sanitizeLabel(label)}]`);

    // Sanitize labels inside {} brackets (decisions) — but not arrow labels like -->|Yes|
    line = line.replace(/\{([^}]+)\}/g, (_, label) => `{${sanitizeLabel(label)}}`);

    // Sanitize labels inside (( )) brackets
    line = line.replace(/\(\(([^)]+)\)\)/g, (_, label) => `((${sanitizeLabel(label)}))`);

    cleaned.push(line);
  }

  return cleaned.join('\n');
}

router.post('/', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const prompt = `Generate a Mermaid.js flowchart diagram for: "${topic}".

Rules:
- Start with: flowchart TD
- Use proper Mermaid syntax only
- Use --> for arrows, never use -- alone
- Use [] for process steps, {} for decisions, (()) for start/end
- Node definitions must ONLY be: A[Label], A{Label}, or A((Label)) — never add {} after a node definition
- Keep node labels short and simple (max 4 words, no special characters)
- Do NOT use special characters like °, ", ", ', or emojis in labels
- Include 6-10 nodes
- Every arrow must have a complete source --> target
- Only output the Mermaid code block, nothing else

Example format:
flowchart TD
    A((Start)) --> B[Step One]
    B --> C{Decision?}
    C -->|Yes| D[Do This]
    C -->|No| E[Do That]
    D --> F((End))
    E --> F

Now generate for: "${topic}"`;

    const aiText = await callMistral(prompt);

    // Extract mermaid code block
    let mermaid = aiText;
    const codeMatch = aiText.match(/```(?:mermaid)?\s*([\s\S]+?)```/);
    if (codeMatch) mermaid = codeMatch[1].trim();

    // Ensure it starts with flowchart
    if (!mermaid.trim().startsWith('flowchart') && !mermaid.trim().startsWith('graph')) {
      const flowMatch = aiText.match(/(flowchart[\s\S]+|graph[\s\S]+)/);
      if (flowMatch) mermaid = flowMatch[1].trim();
    }

    // Clean up common syntax errors
    mermaid = cleanMermaidSyntax(mermaid);

    // Fallback: generate a basic flowchart
    if (!mermaid.includes('-->')) {
      mermaid = `flowchart TD
    A((Start)) --> B[Study ${topic}]
    B --> C{Understand?}
    C -->|Yes| D[Practice Problems]
    C -->|No| E[Review Notes]
    E --> B
    D --> F[Take Quiz]
    F --> G{Pass?}
    G -->|Yes| H((Complete))
    G -->|No| B`;
    }

    res.json({ mermaid, topic });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Flowchart generation failed. Please try again.' });
  }
});

export default router;
