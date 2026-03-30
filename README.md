# AI Job Application Auto-Filler 🚀

Stop spending hours manually filling out repetitive job applications. **AI Job Application Auto-Filler** is a powerful Safari extension that uses advanced AI models to analyze form fields and automatically fill in your professional details, experience, and even draft subjective answers (like cover letter questions) in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Safari](https://img.shields.io/badge/browser-Safari-orange.svg)
![Chrome](https://img.shields.io/badge/browser-Chrome-blue.svg)
![Edge](https://img.shields.io/badge/browser-Edge-lightblue.svg)

---

## ✨ Features

- **🧠 Multi-Model Support:** Choose your preferred AI provider: **Google Gemini**, **OpenAI (GPT-4o)**, or **Anthropic Claude**.
- **📄 PDF Resume Parsing:** Simply drag and drop your PDF resume, and the extension extracts all relevant text locally to build your AI context.
- **🛡️ Privacy First:** Your data and API keys are stored locally in your browser's sandboxed storage. No external servers track your applications.
- **🖥️ Native Sidebar:** A sleek, integrated Browser Sidebar that lets you review AI-generated suggestions before they are injected into the page.
- **✨ Subjective Question Drafts:** For open-ended questions, the AI provides 2-3 tailored options that you can instantly "inject" into the form with one click.

---

## 🛠️ Installation

### Option A: For Safari (macOS)

Since this is an open-source extension, you will need to build it and load it into Safari using Xcode.

1. **Prerequisites:** macOS with **Xcode** installed, **Node.js** (v18+) and **npm**.
2. **Build:**
   ```bash
   git clone git@github.com:drunk-void/job-filler.git
   cd job-filler
   npm install
   npm run build
   ```
3. **Convert:**
   ```bash
   xcrun safari-web-extension-converter ./dist --project-location ./safari-build --app-name "Job Auto-Filler"
   ```
4. **Enable:**
   - Xcode will open the project. Click **Run** to launch the app.
   - In Safari, enable **"Show features for web developers"** in Settings > Advanced.
   - In the **Develop** menu, check **"Allow Unsigned Extensions"**.
   - Enable **Job Auto-Filler** in Settings > Extensions.

### Option B: For Chrome/Chromium (Chrome, Brave, Edge, Arc)

Chromium browsers can load the extension directly without a conversion step.

3. **Build & Load:**
   - **Quick Start:** Run `./build.sh` in your terminal.
   - Or manually: `npm install` and `npm run build`.
   - Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
   - Enable **Developer Mode**.
   - Click **Load unpacked** and select the `dist` folder.
4. **Pin it:** Click the puzzle icon in your toolbar and pin **Job Auto-Filler** for easy access!

---

## 📦 Building & Packaging

For developers and maintainers, we provide helper scripts to streamline the process:

### 🛠️ Build Script (`./build.sh`)
Automates dependency installation and builds the extension for all browsers.
- **Chrome/Edge/Firefox:** Generates the `dist` folder.
- **Safari:** Ensures the source is latest for your Xcode project.
```bash
./build.sh
```

### 🎁 Packaging Script (`./package.sh`)
Packages the extension for distribution.
- **Chrome/Edge/Firefox:** Creates a ZIP of the `dist` folder for store uploads or sharing.
- **Safari:** Creates a source package of the `JobFillerSafari` Xcode project.
```bash
./package.sh
```

> [!NOTE]
> Safari extensions are distributed as native macOS apps. For final distribution, open the `JobFillerSafari` project in Xcode and use the **Product > Archive** menu for App Store submission or signed DMG distribution.

---

---

---

## 🚀 Getting Started

### 1. Configure AI Providers
To use the extension, you need an API key from one of the following:
- [Google AI Studio (Gemini)](https://aistudio.google.com/)
- [OpenAI Platform](https://platform.openai.com/)
- [Anthropic Console](https://console.anthropic.com/)

Open the extension's **Options Page** (via the extension settings or the gear icon in the Sidebar) to select your provider and paste your API key.

### 2. Set Up Your Context
In the Options page:
1. **Upload Resume:** Drag and drop your latest PDF resume.
2. **Additional Context:** Add manual notes like "I am looking for Remote Senior React roles" or "Emphasize my leadership experience in the fintech sector."

### 3. Start Applying!
Navigate to any job application page (LinkedIn, Greenhouse, Lever, etc.), open the extension Sidebar, and click **"Scan Page"**. The AI will analyze the fields and provide you with instant answers!

---

## 🤝 Contributing

**This is an ongoing project!** The web is full of countless variations of form fields, dropdowns, and checkboxes. If you encounter a specific kind of form or field that the extension struggles to extract or fill correctly, your feedback and suggestions are highly encouraged! Please open an issue with an example of the discrepancy or submit a pull request.

Contributions are welcome! If you find a bug or have a feature suggestion, please open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ to help you land your next big role.*
