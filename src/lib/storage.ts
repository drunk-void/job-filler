export interface UserSettings {
  aiProvider: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  userContext: string;
  resumeFileData?: string; // Base64 encoding
  resumeFileName?: string;
  resumeFileType?: string;
  resumeImages?: string[]; // Array of base64 images for OpenAI
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  yoe?: string;
}

export const defaultSettings: UserSettings = {
  aiProvider: 'openai',
  apiKey: '',
  userContext: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  portfolio: '',
  yoe: ''
};

export const loadSettings = async (): Promise<UserSettings> => {
  const result = await chrome.storage.local.get('settings');
  return (result.settings as UserSettings) || defaultSettings;
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  await chrome.storage.local.set({ settings });
};
