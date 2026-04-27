export async function checkCapabilities() {
  if (!window.ai || !window.ai.languageModel) {
    return { supported: false, reason: "No window.ai.languageModel API found." };
  }

  try {
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') {
      return { supported: false, reason: "Hardware not supported or API not ready." };
    }
    return { supported: true, capabilities };
  } catch (error) {
    return { supported: false, reason: error.message };
  }
}

export async function generateCode(promptText) {
  const systemPrompt = `You are a web automation assistant. The user will provide a request to modify the current web page. 
The user may prompt in various languages. Regardless of the input language, return ONLY valid, executable JavaScript code. 
Do not wrap the code in Markdown formatting or backticks (like \`\`\`javascript).
Do not include any explanations.
Just the raw JavaScript code.`;

  const session = await window.ai.languageModel.create({
    systemPrompt: systemPrompt
  });

  try {
    const result = await session.prompt(promptText);
    return cleanResponse(result);
  } finally {
    // Ensure session is destroyed to prevent memory bloat and context leakage
    if (session.destroy) {
      session.destroy();
    }
  }
}

function cleanResponse(response) {
  // Sometimes models still wrap in markdown despite instructions.
  let cleaned = response.trim();
  if (cleaned.startsWith('```javascript')) {
    cleaned = cleaned.substring('```javascript'.length);
  } else if (cleaned.startsWith('```js')) {
    cleaned = cleaned.substring('```js'.length);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring('```'.length);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}
