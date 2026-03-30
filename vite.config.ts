import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webExtension({
      manifest: () => {
        return {
          manifest_version: 3,
          name: "AI Job Auto-Filler",
          version: "1.0.0",
          description: "Use AI to analyze page fields and fill in job applications automatically.",
          action: {
            default_title: "Open Side Panel"
          },
          options_ui: {
            page: "src/options/index.html",
            open_in_tab: true
          },
          background: {
            service_worker: "src/background/index.ts",
            type: "module"
          },
          content_scripts: [
            {
              matches: ["<all_urls>"],
              js: ["src/content/index.tsx"]
            }
          ],
          permissions: ["activeTab", "storage", "scripting", "unlimitedStorage"],
          host_permissions: [
            "https://api.openai.com/*", 
            "https://api.anthropic.com/*", 
            "https://generativelanguage.googleapis.com/*"
          ],
          web_accessible_resources: [
            {
              resources: ["src/panel/index.html", "assets/*", "*.js", "*.css"],
              matches: ["<all_urls>"]
            }
          ]
        };
      }
    }),
  ],
});
