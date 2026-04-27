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
        // Try Method 1: new Function() in MAIN world. 
        // This avoids DOM TrustedTypes completely, but may fail if the site's CSP blocks 'unsafe-eval'.
        try {
          const execute = new Function(scriptCode);
          execute();
          return resolve({ success: true });
        } catch (evalError) {
          console.warn("SiteMorph: eval() failed (likely blocked by page CSP). Falling back to script injection.", evalError);
        }

        // Try Method 2: Inject <script> tag into DOM.
        // This works on sites that block unsafe-eval but allow inline scripts.
        try {
          const script = document.createElement('script');
          let finalCode = `
            try {
              ${scriptCode}
              document.dispatchEvent(new CustomEvent('SiteMorphSuccess'));
            } catch (e) {
              document.dispatchEvent(new CustomEvent('SiteMorphError', { detail: e.message }));
            }
          `;

          // Handle Trusted Types if enforced by the webpage
          if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
              const policy = window.trustedTypes.createPolicy('sitemorph-policy', {
                createScript: (string) => string
              });
              finalCode = policy.createScript(finalCode);
            } catch (policyError) {
              console.warn("SiteMorph: Failed to create TrustedType policy (might be restricted).", policyError);
            }
          }

          script.textContent = finalCode;
          
          let resolved = false;
          const onSuccess = () => { if(!resolved){ resolved=true; resolve({ success: true }); } };
          const onError = (e) => { if(!resolved){ resolved=true; resolve({ success: false, error: e?.detail || 'Unknown script error' }); } };
          
          document.addEventListener('SiteMorphSuccess', onSuccess, { once: true });
          document.addEventListener('SiteMorphError', onError, { once: true });
          
          (document.head || document.documentElement).appendChild(script);
          script.remove();

          // Fallback timeout in case CSP completely blocks the script execution silently
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              document.removeEventListener('SiteMorphSuccess', onSuccess);
              document.removeEventListener('SiteMorphError', onError);
              resolve({ success: false, error: "Execution blocked by strict website security (CSP)." });
            }
          }, 2000);

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
