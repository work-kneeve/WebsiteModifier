# Privacy Policy

SiteMorph (Community Edition) values your privacy. This extension is designed as a secure, local-first tool for interacting with web pages.

## Local Processing

All AI processing is done locally on your device using the built-in Gemini Nano model provided by your browser.
**No data, prompts, or page content ever leaves your browser.**

## Permissions

The extension requests the following permissions to function:

- `activeTab`: Used strictly to apply the locally generated JavaScript to the page you are currently viewing.
- `scripting`: Required to execute the generated code.
- `sidePanel`: Required to display the user interface alongside your web pages.

SiteMorph is completely stateless. It does not use `chrome.storage` to save your modifications or history. Every time you close the tab or side panel, the state is cleared.
