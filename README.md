# Catfish 🐟

An AI-powered desktop assistant that captures your screen content and provides intelligent assistance through Letta Cloud.

## Features

- **Smart Screen Capture**: Automatically captures and analyzes your screen content using OCR
- **Voice Recording**: Record audio to provide additional context to your AI assistant
- **Clipboard Integration**: Includes clipboard content for enhanced context awareness
- **AI-Powered Analysis**: Uses Letta Cloud agents with GPT-4.1 for intelligent responses
- **Privacy-First**: OCR processing happens locally before sending to cloud
- **Modern UI**: Beautiful overlay interface with glass morphism design
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for server)
- Letta Cloud account and API key
- Groq API key (for voice transcription)
- **macOS**: Sox (install with `brew install sox`)
- **Windows**: Sox (download from sox.sourceforge.net)
- **Linux**: Sox (install with `sudo apt-get install sox`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catfish
   ```

2. **Setup the server**
   ```bash
   cd server
   npm install
   cp env.example .env
   # Edit .env with your API keys
   npm run dev
   ```

3. **Setup the client**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Configure API Keys**
   - Get your Letta API key from [app.letta.com/api-keys](https://app.letta.com/api-keys)
   - Get your Groq API key from [console.groq.com](https://console.groq.com)
   - Enter your Letta API key in the app setup screen

## Usage

### Voice Recording Workflow

Catfish now supports voice recording for enhanced context. Here's how it works:

1. **Start Recording**: Press `Cmd+Shift+A` (macOS) or `Ctrl+Shift+A` (Windows/Linux)
   - The overlay will show "🎤 Recording... Press Cmd+Shift+A again to stop and process"
   - Your microphone will start recording audio

2. **Stop Recording & Process**: Press `Cmd+Shift+A` again
   - Recording stops automatically
   - Screen is captured via OCR
   - Audio is transcribed using Groq's Whisper
   - Both visual and audio context are sent to your Letta agent
   - AI response appears in the overlay

### Traditional Workflow (No Voice)

If you prefer not to use voice recording:

1. **Quick Capture**: Press `Cmd+Shift+A` (macOS) or `Ctrl+Shift+A` (Windows/Linux) once
   - Screen is captured immediately
   - Clipboard content is included
   - AI response appears in the overlay

### Overlay Controls

- **Minimize**: Click the `−` button or press `M`
- **Close**: Click the `×` button or press `Esc`
- **Resize**: Drag the resize handles on the right, bottom, or corner
- **Move**: Drag the header area
- **Toggle**: Use the keyboard shortcut to show/hide

## Configuration

### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Required
LETTA_API_KEY=sk-let-your-api-key-here
LETTA_AGENT_ID=agent-your-agent-id-here
GROQ_API_KEY=gsk_your-groq-api-key-here

# Optional
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
LETTA_PROJECT=default-project
```

### Client Settings

Access settings through the app interface:

- **Hotkey**: Customize the activation shortcut
- **Theme**: Choose between light, dark, or auto
- **Privacy**: Enable/disable clipboard analysis
- **Audio**: Enable/disable voice recording (requires microphone permissions)

## Architecture

- **Client**: Electron app with React frontend
- **Server**: Express.js backend with Letta Cloud integration
- **AI Agent**: GPT-4.1 model with multi-modal capabilities
- **Voice**: Groq Whisper for ultra-fast transcription
- **OCR**: Tesseract for local text extraction
- **Security**: Local OCR processing, secure API key storage

## Development

### Project Structure

```
catfish/
├── client/          # Electron app
│   ├── src/
│   │   ├── main/    # Main process
│   │   ├── renderer/# React frontend
│   │   └── preload/ # Preload scripts
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/  # API endpoints
│   │   ├── services/# Business logic
│   │   └── utils/   # Utilities
└── docs/            # Documentation
```

### Building

```bash
# Client
cd client
npm run build
npm run package

# Server
cd server
npm run build
```

## Troubleshooting

### Audio Recording Issues

1. **Microphone Permissions**: Ensure the app has microphone access
2. **Sox Installation**: Make sure Sox is installed and in PATH
3. **Audio Drivers**: Check your system's audio input devices

### Common Issues

- **Port 3001 in use**: Change the server port in `.env`
- **API Key errors**: Verify your Letta and Groq API keys
- **OCR not working**: Check Tesseract installation
- **Overlay not showing**: Try the toggle shortcut

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 