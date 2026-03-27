// Hugging Face Router API wrapper (updated endpoints)

// For text generation (study plans, quizzes, chat) — using Together provider with Qwen
async function callTextGeneration(prompt, maxTokens = 1024) {
  const res = await fetch('https://router.huggingface.co/together/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(maxTokens > 1500 ? 120000 : 60000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// For summarization — using BART on inference endpoint
async function callSummarization(text) {
  const res = await fetch('https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0]?.summary_text || '' : data?.summary_text || '';
}

// Exported functions
export async function callFlanT5(prompt) {
  return callTextGeneration(prompt, 512);
}

export async function callBART(text) {
  return callSummarization(text);
}

export async function callMistral(prompt) {
  return callTextGeneration(prompt, 1024);
}

// For content generation that needs more tokens (blog + linkedin + email + product desc)
export async function callMistralLong(prompt) {
  return callTextGeneration(prompt, 3000);
}