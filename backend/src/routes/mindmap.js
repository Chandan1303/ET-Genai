import { Router } from 'express';
import { callMistral } from '../services/hf.js';

const router = Router();

router.post('/', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const prompt = `Create a structured mind map for the topic: "${topic}".

Output as JSON in this exact format:
{
  "center": "${topic}",
  "branches": [
    {
      "label": "Branch 1 Name",
      "color": "#8b5cf6",
      "children": ["subtopic 1", "subtopic 2", "subtopic 3"]
    },
    {
      "label": "Branch 2 Name", 
      "color": "#6366f1",
      "children": ["subtopic 1", "subtopic 2"]
    }
  ]
}

Create 4-6 branches with 2-4 children each. Only output valid JSON, nothing else.`;

    const aiText = await callMistral(prompt);

    // Extract JSON
    let mindmap;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]+\}/);
      mindmap = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);
    } catch {
      // Fallback structure
      mindmap = {
        center: topic,
        branches: [
          { label: 'Core Concepts', color: '#8b5cf6', children: ['Definition', 'Key Principles', 'Fundamentals'] },
          { label: 'Applications', color: '#6366f1', children: ['Real World Use', 'Examples', 'Case Studies'] },
          { label: 'Related Topics', color: '#10b981', children: ['Prerequisites', 'Extensions', 'Connections'] },
          { label: 'Study Tips', color: '#f59e0b', children: ['Practice Problems', 'Key Formulas', 'Common Mistakes'] },
        ],
      };
    }

    res.json({ mindmap, topic });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Mind map generation failed. Please try again.' });
  }
});

export default router;
