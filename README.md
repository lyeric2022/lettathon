# Catfish 🐠

> An AI-powered overlay assistant that captures your screen, listens to your audio, and provides intelligent responses using Letta Cloud's stateful agents.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-Latest-blue.svg)](https://www.electronjs.org/)
[![Letta](https://img.shields.io/badge/Powered%20by-Letta%20Cloud-purple.svg)](https://docs.letta.com/)

## ✨ Features

- **🖼️ Screen Capture**: Instantly capture and analyze your screen content with OCR
- **🎤 Voice Transcription**: Real-time audio transcription and context understanding
- **📋 Clipboard Integration**: Smart clipboard content analysis
- **🤖 AI-Powered Responses**: Powered by Letta Cloud's stateful agents with GPT-4 Turbo
- **💭 Persistent Memory**: Your agent remembers context across sessions
- **⚡ Quick Access**: Global hotkeys for instant assistance (`Cmd+Shift+A` / `Ctrl+Shift+A`)
- **🔒 Privacy-First**: OCR processing happens locally, only context sent to Letta Cloud

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Letta Cloud account and API key

### Setup

1. **Create a Letta Cloud account**
   - Visit [app.letta.com](https://app.letta.com) and sign up
   - Generate an API key at [app.letta.com/api-keys](https://app.letta.com/api-keys)

2. **Clone and install**
   ```bash
   git clone https://github.com/your-org/catfish.git
   cd catfish
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in project root
   echo "LETTA_API_KEY=your_api_key_here" > .env
   ```

4. **Deploy your Catfish agent to Letta Cloud**
   ```bash
   cd agent
   npm run setup
   ```
   This will create your specialized Catfish agent and save the agent ID to `.env`

5. **Start the application**
   ```bash
   npm run dev
   ```

### First Run

1. **Launch the app** - all three services will start automatically
2. **Grant permissions** for screen capture and microphone access when prompted
3. **Use the hotkey** `Cmd+Shift+A` (macOS) or `Ctrl+Shift+A` (Windows/Linux) to activate
4. **Your agent remembers!** Each conversation builds on previous context

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Electron      │───▶│   Local Server   │───▶│  Letta Cloud    │
│   Overlay UI    │    │   Orchestration  │    │   Stateful      │
└─────────────────┘    └──────────────────┘    │   Agents        │
        │                       │               └─────────────────┘
        ▼                       ▼                       │
┌─────────────────┐    ┌──────────────────┐            ▼
│ Screen Capture  │    │   Local OCR      │    ┌─────────────────┐
│ Audio Recording │    │   Privacy-First  │    │ GPT-4 Turbo +   │
│ Clipboard       │    │   Processing     │    │ Memory + Tools  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**What happens when you activate Catfish:**
1. **Screen captured** and processed locally with OCR
2. **Context prepared** (screen text, clipboard, audio)
3. **Sent to your Letta agent** which maintains conversation memory
4. **AI response** displayed in beautiful overlay
5. **Memory updated** for future conversations

## 📁 Project Structure

```
catfish/
├── client/           # Electron + React overlay application
├── server/           # Local API server (communicates with Letta Cloud)
├── agent/            # Letta agent setup and custom tools
├── docs/             # Documentation and guides
├── .github/          # CI/CD workflows
├── LICENSE           # MIT license
└── README.md         # You are here
```

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
npm install

# Set up your Letta agent (one-time setup)
cd agent && npm run setup

# Start all services in development mode
npm run dev
```

Individual services:
```bash
npm run dev:client   # Electron app (port 3000)
npm run dev:server   # Local API server (port 3001) 
# No local agent needed - uses Letta Cloud!
```

### Building for Production

```bash
# Build all components
npm run build

# Package Electron app
cd client
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Letta Cloud Configuration
LETTA_API_KEY=your_letta_api_key_here
LETTA_AGENT_ID=agent-xxxxxxxxxx  # Auto-generated by setup

# Optional: Letta Configuration
LETTA_PROJECT=default  # Your Letta project name (defaults to 'default')

# Optional: Server Configuration
SERVER_PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Optional: For enhanced local processing
OPENAI_API_KEY=your_openai_key  # If you want better local OCR
```

### Agent Customization

Your Catfish agent can be customized by editing `agent/src/agent-setup.ts`:

```typescript
const config = {
  memoryBlocks: [
    { label: 'human', value: 'User preferences and context' },
    { label: 'persona', value: 'Your agent personality' },
    { label: 'context', value: 'Session context', description: '...' }
  ],
  tools: ['web_search', 'run_code', 'catfish_ocr'],
  model: 'openai/gpt-4.1',  // or try 'anthropic/claude-3-sonnet'
};
```

## 🔒 Privacy & Security

- **🔐 Local OCR**: Screen text extracted locally, only context sent to cloud
- **🔑 Secure Storage**: API keys stored in OS keychain/credential manager  
- **🛡️ HTTPS Only**: All communication encrypted with Letta Cloud
- **🧠 Smart Memory**: Agent remembers context without storing raw screenshots
- **🚫 No Telemetry**: We don't collect usage data

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md).

```bash
# Fork, clone, and create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm test

# Commit and push
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

## 📱 Supported Platforms

- ✅ **macOS** 10.15+ (Intel & Apple Silicon)
- ✅ **Windows** 10+ (x64)
- ✅ **Linux** (Ubuntu 18+, AppImage)

## 🐛 Troubleshooting

### Common Issues

**Agent setup fails?**
```bash
# Check your API key is valid
cd agent && npm run setup
```

**Screen capture not working?**
- Grant screen recording permissions in System Preferences (macOS)
- Run as administrator if needed (Windows)

**"Agent not found" error?**
- Make sure `LETTA_AGENT_ID` is set in your `.env` file
- Run `cd agent && npm run setup` to recreate your agent

**Letta API errors?**
- Verify your `LETTA_API_KEY` is correct
- Check your Letta Cloud quota at [app.letta.com](https://app.letta.com)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Letta](https://docs.letta.com/) for the AI agent platform
- [Electron](https://www.electronjs.org/) for cross-platform desktop framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- The open-source community for inspiration and contributions

---

<div align="center">
  <strong>Made with ❤️ by the Catfish community</strong>
</div> 