# Catfish Setup Guide

## Prerequisites

1. **Letta Cloud Account**: Sign up at [app.letta.com](https://app.letta.com)
2. **Letta API Key**: Get your API key from [https://app.letta.com/api-keys](https://app.letta.com/api-keys)
3. **Groq Account** (for voice transcription): Sign up at [console.groq.com](https://console.groq.com)
4. **Groq API Key**: Get your API key from [https://console.groq.com/keys](https://console.groq.com/keys)

## Quick Setup

### 1. Set Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd catfish/server
cp env.example .env
```

Edit the `.env` file with your API keys:

```env
LETTA_API_KEY=your_actual_letta_api_key_here
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 2. Create Letta Agent

Run the agent setup:

```bash
cd catfish/agent
npm install
npm run build
npm start
```

This will:
- Create a new Catfish agent in your Letta Cloud account
- Save the agent ID to the `.env` file
- Test the agent to ensure it's working

### 3. Start the Server

```bash
cd catfish/server
npm install
npm run dev
```

### 4. Start the Client

```bash
cd catfish/client
npm install
npm run dev
```

## Troubleshooting

### "Agent limit reached" Error

If you see this error during agent setup, you've reached the limit of 10 agents in your Letta Cloud account. You can:

1. **Delete unused agents** in the [Letta Cloud dashboard](https://app.letta.com)
2. **Use an existing agent** by setting `LETTA_AGENT_ID` manually in the `.env` file
3. **Upgrade your plan** for more agents

### Server Connection Issues

If the client can't connect to the server:

1. **Check if server is running** on port 3001
2. **Verify environment variables** are set correctly
3. **Check server logs** for error messages
4. **Ensure no firewall** is blocking localhost:3001

### Renderer Hanging

If the app hangs after pressing the hotkey:

1. **Check server logs** for errors
2. **Verify Letta API key** is valid
3. **Check agent ID** is correct
4. **Restart both client and server**

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LETTA_API_KEY` | Yes | Your Letta Cloud API key |
| `LETTA_AGENT_ID` | Yes | ID of your Catfish agent |
| `GROQ_API_KEY` | Yes | Your Groq API key for voice transcription |
| `LETTA_PROJECT` | No | Project name (defaults to 'default') |
| `PORT` | No | Server port (defaults to 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `LOG_LEVEL` | No | Logging level (info/debug/error) |

## Hotkeys

- **Cmd+Shift+A** (Mac) / **Ctrl+Shift+A** (Windows/Linux): Activate assistant
- **Cmd+Shift+R** (Mac) / **Ctrl+Shift+R** (Windows/Linux): Force reload main app

## Logs

- **Server logs**: `catfish/server/combined.log`
- **Error logs**: `catfish/server/error.log`
- **Assistant logs**: `catfish/server/assistant.log`
- **Agent setup logs**: `catfish/agent/agent-setup.log` 