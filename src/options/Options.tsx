import { useState, useEffect, useRef } from 'react';
import { loadSettings, saveSettings } from '../lib/storage';
import type { UserSettings } from '../lib/storage';
import { extractTextFromPDF } from '../lib/pdf';
import { Save, FileText, Settings as SettingsIcon } from 'lucide-react';

export default function Options() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    setTimeout(() => setSaving(false), 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    
    setPdfLoading(true);
    try {
      const extractedText = await extractTextFromPDF(file);
      const newContext = [
        "--- resume extracted text ---", 
        extractedText, 
        "--- end resume ---", 
        settings.userContext
      ].join('\n\n');
      setSettings({ ...settings, userContext: newContext });
    } catch (error) {
      console.error("Failed to parse PDF", error);
      alert("Failed to parse PDF. Please ensure it is a valid text-based PDF.");
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!settings) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl p-8 space-y-8">
        <div className="flex items-center space-x-3 border-b pb-4">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Auto-Filler Settings</h1>
        </div>

        {/* AI Provider Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">AI Provider</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value as any })}
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder={`Your ${settings.aiProvider} API key...`}
              />
            </div>
          </div>
        </section>

        {/* Context Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Your Context</h2>
          <p className="text-sm text-gray-600">
            Provide your resume text and any additional context you want the AI to consider (e.g., preferred salary, location preferences).
          </p>

          <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center space-y-4 hover:bg-gray-100 transition">
            <input 
              type="file" 
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
            <div className="text-gray-700">
              <span className="font-semibold cursor-pointer text-blue-600 hover:text-blue-800" onClick={() => fileInputRef.current?.click()}>
                Upload a PDF Resume
              </span> to auto-append to your context.
            </div>
            {pdfLoading && <div className="text-sm text-blue-600 font-medium animate-pulse">Parsing PDF...</div>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Context Data</label>
            <textarea
              rows={12}
              className="w-full border-gray-300 rounded-md shadow-sm border p-3 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={settings.userContext}
              onChange={(e) => setSettings({ ...settings, userContext: e.target.value })}
              placeholder="Paste your resume here, or add any other details the AI should know when filling out your applications..."
            />
          </div>
        </section>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:bg-blue-400"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
