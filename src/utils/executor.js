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
      return new Promise((resolve) => {
        try {
          const script = document.createElement('script');
          script.textContent = `
            try {
              ${scriptCode}
              document.dispatchEvent(new CustomEvent('SiteMorphSuccess'));
            } catch (e) {
              document.dispatchEvent(new CustomEvent('SiteMorphError', { detail: e.message }));
            }
          `;
          
          const onSuccess = () => resolve({ success: true });
          const onError = (e) => resolve({ success: false, error: e.detail });
          
          document.addEventListener('SiteMorphSuccess', onSuccess, { once: true });
          document.addEventListener('SiteMorphError', onError, { once: true });
          
          (document.head || document.documentElement).appendChild(script);
          script.remove();
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
      });
    },
    args: [code],
    world: 'MAIN'
  });

  if (results && results[0] && results[0].result) {
    const result = results[0].result;
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}
