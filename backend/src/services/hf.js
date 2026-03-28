// Hugging Face Router API wrapper with retry logic

async function callTextGeneration(prompt, maxTokens = 1024, retries = 2) {
  const timeout = maxTokens > 1500 ? 120000 : 60000;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
        signal: AbortSignal.timeout(timeout),
      });

      if (!res.ok) {
        const errText = await res.text();
        // Don't retry on auth errors
        if (res.status === 401 || res.status === 403) {
          throw new Error(`HF API auth error ${res.status}: Check your HF_API_KEY`);
        }
        // Retry on 429 (rate limit) or 503 (model loading)
        if ((res.status === 429 || res.status === 503) && attempt < retries) {
          const wait = (attempt + 1) * 3000;
          console.log(`HF API ${res.status} — retrying in ${wait}ms (attempt ${attempt + 1}/${retries})`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error(`HF API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content && attempt < retries) {
        console.log(`Empty response — retrying (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return content;

    } catch (err) {
      if (attempt === retries) throw err;
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        console.log(`Request timeout — retrying (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
  return '';
}

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
    const errText = await res.text();
    throw new Error(`HF Summarization error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0]?.summary_text || '' : data?.summary_text || '';
}

export async function callFlanT5(prompt) {
  return callTextGeneration(prompt, 512);
}

export async function callBART(text) {
  return callSummarization(text);
}

export async function callMistral(prompt) {
  return callTextGeneration(prompt, 1024);
}

export async function callMistralLong(prompt) {
  return callTextGeneration(prompt, 3000);
}
