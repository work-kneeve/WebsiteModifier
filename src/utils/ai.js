export async function generateCode(promptText, apiKey) {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key");
  }

  const systemPrompt = `You are a web automation assistant. The user will provide a request to modify the current web page. 
The user may prompt in various languages. Regardless of the input language, return ONLY valid, executable JavaScript code. 
Do not wrap the code in Markdown formatting or backticks (like \`\`\`javascript).
Do not include any explanations.
Just the raw JavaScript code.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    system_instruction: {
      parts: { text: systemPrompt }
    },
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP Error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return cleanResponse(rawText);
}

function cleanResponse(response) {
  let cleaned = response.trim();
  if (cleaned.startsWith('```javascript')) cleaned = cleaned.substring(13);
  else if (cleaned.startsWith('```js')) cleaned = cleaned.substring(5);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
}
