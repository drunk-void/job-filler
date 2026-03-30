import type { UserSettings } from './storage';

export interface FormFieldData {
  id: string;
  name: string;
  type: string;
  label: string;
  options?: string[];
  placeholder?: string;
  value: string;
  required?: boolean;
  min?: string;
  max?: string;
  maxlength?: string;
  pattern?: string;
  autocomplete?: string;
}

export type GeneratedAnswers = Record<string, string | string[]>;

const SYSTEM_PROMPT = `You are an expert career assistant. Your job is to fill out job application forms based on the user's resume and context.
You will be provided with:
1. User Context (resume, preferences, etc.)
2. A JSON list of form fields present on the current page. Each field may have these metadata hints:
   - type: input type (text, number, email, tel, url, radio, checkbox, select, textarea)
   - label: the visible label or question text
   - placeholder: hint text inside the field
   - options: available choices (for select/radio/checkbox)
   - required: whether the field must be filled
   - min/max: numeric bounds (for number inputs - your answer MUST be a plain number within these bounds)
   - maxlength: maximum character count for text fields
   - autocomplete: browser autocomplete hint (e.g. "given-name", "email", "tel", "organization")

For each field, determine the best value to fill it with:
- For number inputs: respond with a plain integer/decimal string within the min/max bounds. NO units or extra text.
- For standard inputs (name, email, phone, links), provide a single string.
- For dropdowns/selects/radio/checkboxes, provide the exact string match from the provided options.
- For standalone checkboxes (e.g., terms and conditions), provide "true" or "false".
- For multi-select or grouped checkboxes, provide an array of exactly matching option strings.
- For subjective/long-form questions (cover letters, "Why this company?", project descriptions), provide an array of 2-3 excellent, professional options the user can choose from.
- Skip file upload fields entirely (do not include them in your response).

Respond ONLY with a valid JSON object where the keys are the field \`id\`s and the values are either a string (for simple fields) or an array of strings (for subjective questions or multi-select fields). Do not wrap in markdown blocks, just return raw JSON.`;

const callOpenAI = async (prompt: string, apiKey: string, images?: string[]): Promise<GeneratedAnswers> => {
  const userContent: any[] = [{ type: "text", text: prompt }];
  if (images && images.length > 0) {
    images.forEach(img => {
      userContent.push({ type: "image_url", image_url: { url: img } });
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) throw new Error("OpenAI API Error");
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
};

const callGemini = async (prompt: string, apiKey: string, pdfBase64?: string, pdfMimeType?: string): Promise<GeneratedAnswers> => {
  const parts: any[] = [{ text: prompt }];
  if (pdfBase64 && pdfMimeType) {
    const b64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    parts.push({
      inlineData: {
        mimeType: pdfMimeType,
        data: b64Data
      }
    });
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error("Gemini API Error");
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
};

const callClaude = async (prompt: string, apiKey: string, pdfBase64?: string, pdfMimeType?: string): Promise<GeneratedAnswers> => {
  const userContent: any[] = [];
  if (pdfBase64 && pdfMimeType) {
    const b64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: pdfMimeType,
        data: b64Data
      }
    });
  }
  userContent.push({ type: "text", text: prompt + "\n\nRespond with valid JSON only." });

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
      messages: [{ role: "user", content: userContent }],
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
  
  const basicContext = [
    settings.firstName && `First Name: ${settings.firstName}`,
    settings.lastName && `Last Name: ${settings.lastName}`,
    settings.email && `Email: ${settings.email}`,
    settings.phone && `Phone: ${settings.phone}`,
    settings.linkedin && `LinkedIn: ${settings.linkedin}`,
    settings.github && `GitHub: ${settings.github}`,
    settings.portfolio && `Portfolio: ${settings.portfolio}`,
    settings.yoe && `Years of Experience: ${settings.yoe}`,
  ].filter(Boolean).join('\n');

  const fullUserContext = [
    basicContext ? `BASIC DETAILS:\n${basicContext}\n` : "",
    `ADDITIONAL USER CONTEXT:\n${settings.userContext}`
  ].join('');

  const prompt = `${fullUserContext}\n\nFORM FIELDS:\n${JSON.stringify(fields, null, 2)}`;

  if (settings.aiProvider === 'openai') {
    return await callOpenAI(prompt, settings.apiKey, settings.resumeImages);
  } else if (settings.aiProvider === 'gemini') {
    const isPDF = settings.resumeFileType === 'application/pdf';
    return await callGemini(prompt, settings.apiKey, isPDF ? settings.resumeFileData : undefined, isPDF ? settings.resumeFileType : undefined);
  } else if (settings.aiProvider === 'claude') {
    const isPDF = settings.resumeFileType === 'application/pdf';
    return await callClaude(prompt, settings.apiKey, isPDF ? settings.resumeFileData : undefined, isPDF ? settings.resumeFileType : undefined);
  }
  
  throw new Error("Invalid AI provider");
};
