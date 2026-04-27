export async function checkCapabilities() {
  // First check if the extension context has it
  if (window.ai && window.ai.languageModel) {
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'no') {
        return { supported: false, reason: "Hardware not supported or API not ready." };
      }
      return { supported: true, capabilities, context: 'local' };
    } catch (error) {
      return { supported: false, reason: error.message };
    }
  }

  // Fallback: Check if the active tab has it (Extension contexts sometimes block experimental APIs)
  try {
    // eslint-disable-next-line no-undef
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return { supported: false, reason: "No active tab to use as fallback." };

    // eslint-disable-next-line no-undef
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        if (!window.ai || !window.ai.languageModel) return { supported: false, reason: "No window.ai.languageModel API found." };
        try {
          const cap = await window.ai.languageModel.capabilities();
          if (cap.available === 'no') return { supported: false, reason: "Hardware not supported (available=no)" };
          return { supported: true, available: cap.available };
        } catch (e) {
          return { supported: false, reason: e.message };
        }
      }
    });

    if (results && results[0] && results[0].result) {
      const res = results[0].result;
      if (res.supported) return { supported: true, context: 'tab' };
      return { supported: false, reason: res.reason };
    }
  } catch (err) {
    return { supported: false, reason: "Fallback check failed: " + err.message };
  }

  return { supported: false, reason: "No window.ai.languageModel API found." };
}

export async function generateCode(promptText) {
  const systemPrompt = `You are a web automation assistant. The user will provide a request to modify the current web page. 
The user may prompt in various languages. Regardless of the input language, return ONLY valid, executable JavaScript code. 
Do not wrap the code in Markdown formatting or backticks (like \`\`\`javascript).
Do not include any explanations.
Just the raw JavaScript code.`;

  // Try local first
  if (window.ai && window.ai.languageModel) {
    const session = await window.ai.languageModel.create({ systemPrompt });
    try {
      const result = await session.prompt(promptText);
      return cleanResponse(result);
    } finally {
      if (session.destroy) session.destroy();
    }
  }

  // Fallback to active tab
  // eslint-disable-next-line no-undef
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // eslint-disable-next-line no-undef
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (userPrompt, sysPrompt) => {
      if (!window.ai || !window.ai.languageModel) throw new Error("API missing in tab.");
      const session = await window.ai.languageModel.create({ systemPrompt: sysPrompt });
      try {
        return await session.prompt(userPrompt);
      } finally {
        if (session.destroy) session.destroy();
      }
    },
    args: [promptText, systemPrompt]
  });

  if (results && results[0] && results[0].result) {
    return cleanResponse(results[0].result);
  }
  
  throw new Error("Failed to generate code in tab fallback.");
}

function cleanResponse(response) {
  let cleaned = response.trim();
  if (cleaned.startsWith('```javascript')) cleaned = cleaned.substring(13);
  else if (cleaned.startsWith('```js')) cleaned = cleaned.substring(5);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
}
