/// <reference types="chrome" />
import { generateAnswers } from '../lib/ai';
import { loadSettings } from '../lib/storage';

// Always use the injected sidebar for consistent per-page state
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Job Filler Extension installed");
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'PROCESS_AI_FIELDS') {
    (async () => {
      try {
        const settings = await loadSettings();
        if (!settings.apiKey) throw new Error("API Key is missing. Check settings.");
        
        const answers = await generateAnswers(request.fields, settings);
        sendResponse({ answers });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        sendResponse({ error: errorMessage });
      }
    })();
    return true; // indicates asynchronous response
  }
});
