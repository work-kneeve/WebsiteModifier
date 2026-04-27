export async function executeInActiveTab(code) {
  // eslint-disable-next-line no-undef
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    console.warn("Chrome tabs API not available (are you running outside an extension?)");
    return;
  }

  // eslint-disable-next-line no-undef
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    throw new Error("No active tab found");
  }

  // eslint-disable-next-line no-undef
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (scriptCode) => {
      try {
        // Wrap the generated code in a safe executor
        const execute = new Function(scriptCode);
        execute();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    args: [code]
  });

  if (results && results[0] && results[0].result) {
    const result = results[0].result;
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}
