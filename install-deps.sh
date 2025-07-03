# Catfish System Dependencies Installation Script

set -e

echo "🐟 Catfish System Dependencies Installer"
echo "========================================"

OS=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "📱 Detected OS: $OS"

check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            echo "✅ Node.js $NODE_VERSION (>=18 required)"
            return 0
        else
            echo "❌ Node.js $NODE_VERSION found, but >=18 required"
            return 1
        fi
    else
        echo "❌ Node.js not found"
        return 1
    fi
}

check_sox() {
    if command -v sox &> /dev/null; then
        SOX_VERSION=$(sox --version | head -n1)
        echo "✅ $SOX_VERSION"
        return 0
    else
        echo "❌ Sox not found"
        return 1
    fi
}

# Install dependencies based on OS
install_deps() {
    case $OS in
        "macos")
            echo "📦 Installing dependencies for macOS..."
            if command -v brew &> /dev/null; then
                echo "🍺 Using Homebrew..."
                if [ -f "Brewfile" ]; then
                    brew bundle
                else
                    brew install node@18 sox
                fi
            else
                echo "❌ Homebrew not found. Please install Homebrew first:"
                echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            ;;
        "linux")
            echo "📦 Installing dependencies for Linux..."
            if command -v apt-get &> /dev/null; then
                echo "🔧 Using apt-get..."
                sudo apt-get update
                sudo apt-get install -y nodejs npm sox
            elif command -v yum &> /dev/null; then
                echo "🔧 Using yum..."
                sudo yum install -y nodejs npm sox
            else
                echo "❌ Package manager not found. Please install Node.js 18+ and Sox manually."
                exit 1
            fi
            ;;
        "windows")
            echo "📦 Windows detected..."
            echo "Please install the following manually:"
            echo "1. Node.js 18+ from https://nodejs.org/"
            echo "2. Sox from http://sox.sourceforge.net/Main/HomePage"
            echo "Or use Chocolatey: choco install nodejs sox"
            ;;
    esac
}

echo ""
echo "🔍 Checking current dependencies..."

NODE_OK=false
SOX_OK=false

echo -n "Node.js: "
if check_node; then
    NODE_OK=true
fi

echo -n "Sox: "
if check_sox; then
    SOX_OK=true
fi

if [ "$NODE_OK" = true ] && [ "$SOX_OK" = true ]; then
    echo ""
    echo "✅ All system dependencies are already installed!"
else
    echo ""
    echo "📥 Installing missing dependencies..."
    install_deps
fi

echo ""
echo "📋 Next steps:"
echo "1. Install npm dependencies: npm install"
echo "2. Set up environment variables in server/.env"
echo "3. Get API keys:"
echo "   - Letta API key: https://app.letta.com/api-keys"
echo "   - Groq API key: https://console.groq.com"
echo "4. Run the project: npm run dev"
echo ""
echo "🎉 Setup complete! Run 'npm install && npm run dev' to start Catfish." 