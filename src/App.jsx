import { useState, useEffect } from 'react';
import { checkCapabilities, generateCode } from './utils/ai';
import { executeInActiveTab } from './utils/executor';

function App() {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function init() {
      const result = await checkCapabilities();
      setCapabilities(result);
      setLoading(false);
    }
    init();
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleApply = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const code = await generateCode(prompt);
      await executeInActiveTab(code);
    } catch (error) {
      console.error(error);
      showToast("Try rephrasing your request");
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const applyTemplate = (templatePrompt) => {
    setPrompt(templatePrompt);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!capabilities?.supported) {
    return (
      <div className="p-6 h-screen bg-background text-text flex flex-col justify-center">
        <div className="bg-surface border border-red-500/30 p-6 rounded-xl shadow-lg backdrop-blur-sm text-center">
          <div className="text-red-400 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Hardware Not Supported</h2>
          <p className="text-sm text-text-muted mb-4">
            SiteMorph requires the Gemini Nano (Prompt API) to function locally.
          </p>
          <div className="bg-background/50 rounded p-4 text-left text-xs text-text-muted space-y-2">
            <p>1. Ensure Chrome version is 140+</p>
            <p>2. Go to <code>chrome://flags</code></p>
            <p>3. Enable <b>#prompt-api-for-gemini-nano</b></p>
            <p>4. Enable <b>#optimization-guide-on-device-model</b></p>
            <p>5. Restart Chrome</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text relative p-4">
      <header className="mb-6 mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            SiteMorph
          </h1>
          <p className="text-xs text-text-muted">Community Edition</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" title="Gemini Nano Active"></div>
      </header>

      <main className="flex-1 flex flex-col gap-4">
        <div className="relative group">
          <textarea
            className="w-full h-32 bg-surface border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-inner"
            placeholder="What would you like to change on this page?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          {isGenerating && (
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center border border-primary/50">
              <div className="flex items-center gap-3 bg-surface border border-slate-700 px-4 py-2 rounded-full shadow-lg">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleApply}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isGenerating ? 'Generating...' : 'Morph Page'}
        </button>

        <div className="mt-4">
          <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Prompt Templates</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyTemplate('Enable Reader Mode: Hide all sidebars, navigation menus, and ads. Make the main content area wider and center it. Increase the font size to 18px and line height to 1.6.')}
              className="text-xs bg-surface border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full transition-colors"
            >
              📖 Reader Mode
            </button>
            <button
              onClick={() => applyTemplate('Enable Dark Mode: Change the background color of the body and all main containers to a dark color (#1a1a1a). Change text colors to a light color (#e5e5e5). Invert image colors slightly if needed.')}
              className="text-xs bg-surface border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full transition-colors"
            >
              🌙 Dark Mode
            </button>
            <button
              onClick={() => applyTemplate('Highlight all links on the page by giving them a yellow background with black text.')}
              className="text-xs bg-surface border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full transition-colors"
            >
              🔗 Highlight Links
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-4 left-4 right-4 transition-transform duration-300 ease-in-out flex justify-center pointer-events-none ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg border border-red-400">
          {toastMessage}
        </div>
      </div>
    </div>
  );
}

export default App;
