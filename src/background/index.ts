/// <reference types="chrome" />
import { generateAnswers } from '../lib/ai';
import { loadSettings } from '../lib/storage';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => console.error(error));

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
