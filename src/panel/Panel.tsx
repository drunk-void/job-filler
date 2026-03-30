import { useState } from 'react';
import type { FormFieldData, GeneratedAnswers } from '../lib/ai';
import { Bot, RefreshCw, CheckCircle, Wand2, Settings } from 'lucide-react';

export default function Panel() {
  const [fields, setFields] = useState<FormFieldData[]>([]);
  const [answers, setAnswers] = useState<GeneratedAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab.");

      const res = await new Promise<{ fields: FormFieldData[] }>((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT_FIELDS' }, resolve);
      });

      if (!res?.fields || res.fields.length === 0) {
        throw new Error("No form fields detected on this page.");
      }

      setFields(res.fields);
      
      // Request AI answers from Background Script
      const aiRes = await new Promise<{ answers?: GeneratedAnswers; error?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: 'PROCESS_AI_FIELDS', fields: res.fields }, resolve);
      });

      if (aiRes.error) throw new Error(aiRes.error);
      if (aiRes.answers) setAnswers(aiRes.answers);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scan or process page.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const injectSingle = async (id: string, value: string) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'FILL_INPUT', id, value });
  };

  const injectAll = async () => {
    const singles: Record<string, string> = {};
    for (const [id, val] of Object.entries(answers)) {
      if (typeof val === 'string') singles[id] = val;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'FILL_ALL', data: singles });
  };

  const openOptions = () => chrome.runtime.openOptionsPage();

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col p-4 font-sans text-sm">
      <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
        <Bot className="w-6 h-6 text-blue-600" />
        <h1 className="text-lg font-bold text-gray-800 flex-1">Auto-Filler</h1>
        <button onClick={openOptions} className="p-1 hover:bg-gray-200 rounded" title="Settings">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {!loading && fields.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Click "Scan Page" to analyze the current job application.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center space-y-2 mt-10">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-600">Analyzing form and generating answers...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {Object.keys(answers).map(id => {
          const field = fields.find(f => f.id === id);
          if (!field) return null;
          
          const val = answers[id];
          const isArray = Array.isArray(val);

          return (
            <div key={id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-700 capitalize break-words w-[80%]">
                  {field.label || field.name || field.id}
                </span>
                {!isArray && (
                  <button 
                    onClick={() => injectSingle(id, val as string)}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                    title="Inject"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isArray ? (
                <div className="space-y-2">
                  {(val as string[]).map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => injectSingle(id, opt)}
                      className="text-left w-full p-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded border border-blue-200 text-xs transition transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-xs truncate" title={val as string}>{val}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t space-y-2 mt-auto">
        <button
          onClick={scanPage}
          disabled={loading}
          className="w-full h-10 flex items-center justify-center space-x-2 bg-gray-900 border border-gray-300 hover:bg-gray-800 text-white rounded-lg font-medium transition disabled:bg-gray-500"
        >
          <Wand2 className="w-4 h-4" />
          <span>Scan Page</span>
        </button>
        {Object.keys(answers).length > 0 && (
          <button
            onClick={injectAll}
            className="w-full h-10 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Auto-Fill Singles
          </button>
        )}
      </div>
    </div>
  );
}
