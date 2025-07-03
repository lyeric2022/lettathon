# Getting Started with Catfish

Welcome to Catfish, your AI-powered screen assistant powered by Letta Cloud! This guide will help you set up and start using Catfish in minutes.

## Prerequisites

- **Node.js 18+** and npm 8+
- **Letta Cloud account** - [Sign up here](https://app.letta.com)

## Quick Setup

### Step 1: Get Your Letta API Key

1. Visit [app.letta.com](https://app.letta.com) and create an account
2. Go to [API Keys](https://app.letta.com/api-keys) and generate a new key
3. Copy your API key - you'll need it in the next step

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/catfish.git
cd catfish

# Install all dependencies
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Your Letta Cloud API key
LETTA_API_KEY=your_api_key_here

# Optional: Letta project (defaults to 'default')
LETTA_PROJECT=default

# Optional: Server configuration
SERVER_PORT=3001
NODE_ENV=development
```

### Step 4: Set Up Your Catfish Agent

This will create a specialized Catfish agent on Letta Cloud:

```bash
cd agent
npm run setup
```

You should see output like:
```
🐟 Setting up Catfish AI Assistant with Letta Cloud...

✅ Catfish agent created successfully!
📝 Agent ID: agent-xxxxxxxxxx
🔧 Agent ID saved to root .env file

🐟 Catfish Agent Response:
Hello! I'm your Catfish screen assistant. I can help you analyze screen content, understand clipboard data, and assist with your digital workflows...

🚀 Your Catfish agent is ready to use!
```

### Step 5: Start the Application

```bash
# Go back to project root
cd ..

# Start all services
npm run dev
```

This will start:
- **Server** on port 3001 (communicates with Letta Cloud)
- **Electron client** on port 3000 (the overlay app)

## First Use

1. **Grant Permissions**: When prompted, allow screen recording and microphone access
2. **Activate Catfish**: Press `Cmd+Shift+A` (macOS) or `Ctrl+Shift+A` (Windows/Linux)
3. **Enjoy!**: Your AI assistant will analyze your screen and respond

## How It Works

```
Your Screen → Local OCR → Letta Cloud Agent → AI Response → Overlay
```

1. **Screen Capture**: When you press the hotkey, Catfish captures your screen
2. **Local Processing**: OCR extracts text locally (privacy-first!)
3. **Context to Agent**: Only the extracted text context is sent to your Letta agent
4. **AI Response**: Your stateful agent responds with helpful insights
5. **Memory**: The agent remembers this interaction for future conversations

## What Makes Catfish Special

### 🧠 Stateful Memory
Unlike regular AI assistants, your Catfish agent remembers:
- Previous screen captures and contexts
- Your preferences and usage patterns  
- Ongoing projects and workflows

### 🔒 Privacy-First Design
- Screen content processed locally with OCR
- Only text context sent to cloud (not raw screenshots)
- Your API keys stored securely in OS keychain

### ⚡ Lightning Fast
- Global hotkey activation
- Optimized OCR processing
- Real-time overlay responses

## Customizing Your Agent

You can customize your agent's behavior by editing `agent/src/agent-setup.ts`:

```typescript
const config = {
  memoryBlocks: [
    {
      label: 'human',
      value: 'Customize user context here...'
    },
    {
      label: 'persona', 
      value: 'I am a helpful coding assistant specialized in...'
    }
  ],
  tools: ['web_search', 'run_code', 'catfish_ocr'],
  model: 'openai/gpt-4.1' // or try 'anthropic/claude-3-sonnet'
};
```

After making changes, re-run:
```bash
cd agent && npm run setup
```

## Troubleshooting

### Agent Setup Issues

**"LETTA_API_KEY is required" error?**
- Make sure you've set `LETTA_API_KEY` in your `.env` file
- Verify your API key is correct at [app.letta.com/api-keys](https://app.letta.com/api-keys)

**Agent creation fails?**
- Check your Letta Cloud quota at [app.letta.com](https://app.letta.com)
- Try a different model (e.g., `openai/gpt-4o-mini` for faster responses)

### Application Issues

**Screen capture not working?**
- **macOS**: Grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording
- **Windows**: Run as administrator if needed
- **Linux**: Check if running under Wayland (X11 recommended)

**Hotkey not working?**
- Check if another app is using `Cmd+Shift+A` / `Ctrl+Shift+A`
- Try restarting the app
- Check console logs for permission errors

**"Agent not found" error?**
- Ensure `LETTA_AGENT_ID` is set in `.env` (should be auto-set during setup)
- Re-run agent setup: `cd agent && npm run setup`

## Development Mode

For active development:

```bash
# Terminal 1: Server (with auto-reload)
npm run dev:server

# Terminal 2: Client (Electron app)
npm run dev:client

# Make changes to agent
cd agent && npm run setup  # Re-deploy after changes
```

## Next Steps

- Read the [Architecture Guide](architecture.md) to understand the system
- Explore [Contributing Guidelines](../CONTRIBUTING.md) to help improve Catfish
- Join our community discussions

Happy screen analyzing! 🐟✨ 