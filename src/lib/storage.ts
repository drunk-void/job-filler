export interface UserSettings {
  aiProvider: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  userContext: string;
}

export const defaultSettings: UserSettings = {
  aiProvider: 'openai',
  apiKey: '',
  userContext: ''
};

export const loadSettings = async (): Promise<UserSettings> => {
  const result = await chrome.storage.local.get('settings');
  return (result.settings as UserSettings) || defaultSettings;
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  await chrome.storage.local.set({ settings });
};
