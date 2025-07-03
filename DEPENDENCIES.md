# Dependencies Guide

This guide explains how to install all dependencies for the Catfish project.

## Dependency Files

This project provides several files to help you install dependencies easily:

### System Dependencies

- **`requirements.txt`** - Lists all system-level dependencies with installation instructions
- **`Brewfile`** - macOS Homebrew bundle file for automated installation
- **`install-deps.sh`** - Cross-platform installation script (Linux, macOS, Windows)

### JavaScript Dependencies

- **`package.json`** - Root workspace configuration with shared dependencies
- **`client/package.json`** - Electron app dependencies
- **`server/package.json`** - Express server dependencies  
- **`agent/package.json`** - Letta agent setup dependencies

## Installation Methods

### 🚀 Quick Start (Recommended)

Install everything with one command:

```bash
npm run quick-start
```

This will:
1. Install system dependencies (Node.js, Sox)
2. Install all npm packages
3. Guide you through API key setup

### 📋 Step-by-Step Installation

#### 1. System Dependencies

Choose your preferred method:

**Automated Script (Cross-platform):**
```bash
./install-deps.sh
```

**macOS with Homebrew:**
```bash
brew bundle
```

**Manual Installation:**
- See `requirements.txt` for detailed instructions
- Install Node.js 18+ from [nodejs.org](https://nodejs.org)
- Install Sox for your OS (see README.md)

#### 2. JavaScript Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (client, server, agent).

#### 3. Environment Setup

```bash
cd server
cp env.example .env
# Edit .env with your API keys
```

Required API keys:
- **LETTA_API_KEY**: Get from [app.letta.com/api-keys](https://app.letta.com/api-keys)
- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com)

## System Requirements

| Dependency | Version | Purpose | Installation |
|------------|---------|---------|--------------|
| Node.js | ≥18.0.0 | Runtime | [nodejs.org](https://nodejs.org) |
| npm | ≥8.0.0 | Package manager | Included with Node.js |
| Sox | Latest | Audio recording | See OS-specific instructions |

### Platform-Specific Instructions

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew bundle
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm sox
```

#### Windows
```bash
# Using Chocolatey
choco install nodejs sox

# Or install manually:
# 1. Node.js from https://nodejs.org
# 2. Sox from http://sox.sourceforge.net
```

## Troubleshooting

### Common Issues

**Command not found: node**
- Install Node.js 18+ from [nodejs.org](https://nodejs.org)
- Restart your terminal after installation

**Permission denied: ./install-deps.sh**
```bash
chmod +x install-deps.sh
```

**Sox not found**
- macOS: `brew install sox`
- Linux: `sudo apt-get install sox`
- Windows: Download from sox.sourceforge.net

**npm workspaces not working**
- Ensure you're using npm 8+ with `npm --version`
- Update npm: `npm install -g npm@latest`

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting section in README.md](README.md#troubleshooting)
2. Verify all system dependencies are installed: `./install-deps.sh`
3. Check Node.js version: `node --version` (should be ≥18)
4. Verify Sox installation: `sox --version`

## Development

For development setup, also install optional tools:

```bash
# Git (for version control)
# macOS: included with Xcode Command Line Tools
# Linux: sudo apt-get install git
# Windows: https://git-scm.com

# Additional development tools are installed automatically via package.json
```

## Next Steps

After installation:

1. **Configure API Keys**: Edit `server/.env` with your Letta and Groq API keys
2. **Start Development**: Run `npm run dev`
3. **Setup Agent**: Run `npm run setup` (in agent directory)
4. **Test Voice Recording**: Ensure microphone permissions are granted

Happy coding! 🐟 