import type { UserSettings } from './storage';

export interface FormFieldData {
  id: string;
  name: string;
  type: string;
  label: string;
  options?: string[];
  placeholder?: string;
  value: string;
}

export type GeneratedAnswers = Record<string, string | string[]>;

const SYSTEM_PROMPT = `You are an expert career assistant. Your job is to fill out job application forms based on the user's resume and context.
You will be provided with:
1. User Context (resume, preferences, etc.)
2. A JSON list of form fields present on the current page.

For each field, determine the best value to fill it with. 
- For standard inputs (name, email, phone, links), provide a single string.
- For dropdowns/selects/radio, provide the exact string match if possible.
- For subjective/long-form questions (cover letters, "Why this company?", project descriptions), provide an array of 2-3 excellent, professional options the user can choose from.

Respond ONLY with a valid JSON object where the keys are the field \`id\`s and the values are either a string (for simple fields) or an array of strings (for subjective questions). Do not wrap in markdown blocks, just return raw JSON.`;

const callOpenAI = async (prompt: string, apiKey: string): Promise<GeneratedAnswers> => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) throw new Error("OpenAI API Error");
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
};

const callGemini = async (prompt: string, apiKey: string): Promise<GeneratedAnswers> => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error("Gemini API Error");
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
};

const callClaude = async (prompt: string, apiKey: string): Promise<GeneratedAnswers> => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt + "\n\nRespond with valid JSON only." }],
      max_tokens: 4000
    })
  });
  if (!res.ok) throw new Error("Claude API Error");
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  return JSON.parse(text);
};

export const generateAnswers = async (
  fields: FormFieldData[],
  settings: UserSettings
): Promise<GeneratedAnswers> => {
  if (!settings.apiKey) throw new Error("API Key is missing. Please configure it in the extension options.");
  const prompt = `USER CONTEXT:\n${settings.userContext}\n\nFORM FIELDS:\n${JSON.stringify(fields, null, 2)}`;

  if (settings.aiProvider === 'openai') {
    return await callOpenAI(prompt, settings.apiKey);
  } else if (settings.aiProvider === 'gemini') {
    return await callGemini(prompt, settings.apiKey);
  } else if (settings.aiProvider === 'claude') {
    // Note: Claude CORS is strict. Extension background scripts might bypass it, otherwise a proxy is needed.
    return await callClaude(prompt, settings.apiKey);
  }
  
  throw new Error("Invalid AI provider");
};
