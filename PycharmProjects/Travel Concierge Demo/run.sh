#!/bin/bash

# AI Travel Concierge Platform - Complete Setup & Run Script
# This script sets up and starts both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║               🚀 AI Travel Concierge Platform               ║${NC}"
    echo -e "${BLUE}║                Production-Ready Setup Script                ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}🔹 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_step "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
        exit 1
    fi
    
    local python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    print_info "Python version: $python_version"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    local node_version=$(node --version)
    print_info "Node.js version: $node_version"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "All requirements satisfied!"
}

# Setup backend
setup_backend() {
    print_step "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate || source venv/Scripts/activate
    
    # Upgrade pip
    print_info "Upgrading pip..."
    pip install --upgrade pip --quiet
    
    # Install requirements
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt --quiet
    
    print_success "Backend setup completed!"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_step "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install --silent
    
    print_success "Frontend setup completed!"
    cd ..
}

# Create environment files
create_env_files() {
    print_step "Creating environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        print_info "Creating backend .env file..."
        cat > backend/.env << 'EOF'
# AI Travel Concierge Platform - Environment Configuration

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# AI/ML Configuration (Add your API keys here)
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/travel_concierge
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs (Add your API keys here)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
AMADEUS_API_KEY=your-amadeus-api-key-here
AMADEUS_API_SECRET=your-amadeus-api-secret-here

# Monitoring
LOG_LEVEL=INFO
EOF
        print_warning "Please update backend/.env with your actual API keys"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        print_info "Creating frontend .env.local file..."
        cat > frontend/.env.local << 'EOF'
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=AI Travel Concierge
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
EOF
        print_warning "Please update frontend/.env.local with your actual API keys"
    fi
    
    print_success "Environment files created!"
}

# Create additional frontend files
create_frontend_files() {
    print_step "Creating additional frontend files..."
    
    # Create public directory and favicon
    mkdir -p frontend/public
    
    # Create a simple favicon.ico placeholder
    # (In production, replace with actual favicon)
    if [ ! -f "frontend/public/favicon.ico" ]; then
        print_info "Creating placeholder favicon..."
        # Create a simple text-based favicon placeholder
        echo "Favicon placeholder - replace with actual icon" > frontend/public/favicon.ico
    fi
    
    # Create next.config.js if it doesn't exist
    if [ ! -f "frontend/next.config.js" ]; then
        print_info "Creating Next.js configuration..."
        cat > frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['localhost', 'example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  output: 'standalone',
}

module.exports = nextConfig
EOF
    fi
    
    # Create tailwind.config.js if it doesn't exist
    if [ ! -f "frontend/tailwind.config.js" ]; then
        print_info "Creating Tailwind configuration..."
        cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.8)',
          dark: 'rgba(17, 24, 39, 0.8)',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
EOF
    fi
    
    # Create postcss.config.js if it doesn't exist
    if [ ! -f "frontend/postcss.config.js" ]; then
        print_info "Creating PostCSS configuration..."
        cat > frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    fi
    
    print_success "Frontend files created!"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

start_backend() {
    print_step "Starting backend server..."
    cd backend
    source venv/bin/activate || source venv/Scripts/activate
    if ! check_port 8000; then
        print_warning "Port 8000 is already in use. Killing existing process..."
        pkill -f "uvicorn.*8000" || true
        sleep 2
    fi
    print_info "Starting FastAPI server on http://localhost:8000"
    python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend_pid
    cd ..
    print_success "Backend server started (PID: $BACKEND_PID)"
}

start_frontend() {
    print_step "Starting frontend server..."
    cd frontend
    if ! check_port 3007; then
        print_warning "Port 3007 is already in use. Killing existing process..."
        pkill -f "next.*3007" || true
        sleep 2
    fi
    print_info "Starting Next.js server on http://localhost:3007"
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .frontend_pid
    cd ..
    print_success "Frontend server started (PID: $FRONTEND_PID)"
}

wait_for_services() {
    print_step "Waiting for services to start..."
    print_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
    print_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3007 > /dev/null 2>&1; then
            print_success "Frontend is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
}

show_final_info() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  🎉 Setup Complete! 🎉                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📱 Frontend Application:${NC} http://localhost:3007"
    echo -e "${CYAN}🔧 Backend API:${NC}          http://localhost:8000" 
    echo -e "${CYAN}📚 API Documentation:${NC}   http://localhost:8000/docs"
    echo ""
    echo -e "${YELLOW}✨ Features you can test:${NC}"
    echo -e "   • Chat with AI travel agents"
    echo -e "   • Upload images for AI-powered destination suggestions"
    echo -e "   • Explore popular destinations"
    echo -e "   • Use quick action buttons"
    echo -e "   • Real-time conversation with typing indicators"
    echo ""
    echo -e "${YELLOW}🔑 Next steps:${NC}"
    echo -e "   1. Add your API keys to backend/.env and frontend/.env.local"
    echo -e "   2. Test the image search feature with travel photos"
    echo -e "   3. Try different conversation flows with the AI"
    echo -e "   4. Explore the agent switching functionality"
    echo ""
    echo -e "${YELLOW}🛑 To stop the servers:${NC}"
    echo -e "   Press Ctrl+C or run: ./stop-servers.sh"
    echo ""
}

create_stop_script() {
    cat > stop-servers.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping AI Travel Concierge servers..."

# Kill backend
if [ -f "backend/.backend_pid" ]; then
    BACKEND_PID=$(cat backend/.backend_pid)
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    rm backend/.backend_pid
fi

# Kill frontend  
if [ -f "frontend/.frontend_pid" ]; then
    FRONTEND_PID=$(cat frontend/.frontend_pid)
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || true
    rm frontend/.frontend_pid
fi

# Kill any remaining processes
pkill -f "uvicorn.*8000" 2>/dev/null || true
pkill -f "next.*3007" 2>/dev/null || true

echo "✅ All servers stopped!"
EOF

    chmod +x stop-servers.sh
}

cleanup() {
    echo ""
    print_info "Cleaning up..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f backend/.backend_pid frontend/.frontend_pid
    print_info "Cleanup complete."
}

trap cleanup EXIT INT TERM

main() {
    print_header
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory (where backend/ and frontend/ folders exist)"
        exit 1
    fi
    case "${1:-start}" in
        "setup")
            print_info "Running setup only..."
            check_requirements
            setup_backend
            setup_frontend
            create_env_files
            create_frontend_files
            create_stop_script
            print_success "Setup completed! Run './run.sh start' to start the servers."
            ;;
        "start")
            print_info "Setting up and starting servers..."
            check_requirements
            setup_backend
            setup_frontend
            create_env_files
            create_frontend_files
            create_stop_script
            start_backend
            sleep 3
            start_frontend
            wait_for_services
            show_final_info
            print_info "Servers are running. Press Ctrl+C to stop."
            while true; do
                sleep 1
            done
            ;;
        "stop")
            print_info "Stopping servers..."
            ./stop-servers.sh 2>/dev/null || {
                pkill -f "uvicorn.*8000" 2>/dev/null || true
                pkill -f "next.*3007" 2>/dev/null || true
                print_success "Servers stopped!"
            }
            ;;
        "restart")
            print_info "Restarting servers..."
            $0 stop
            sleep 2
            $0 start
            ;;
        "status")
            print_info "Checking server status..."
            if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                print_success "Backend is running on http://localhost:8000"
            else
                print_error "Backend is not running"
            fi
            if curl -s http://localhost:3007 > /dev/null 2>&1; then
                print_success "Frontend is running on http://localhost:3007"
            else
                print_error "Frontend is not running"
            fi
            ;;
        "logs")
            print_info "Showing recent logs..."
            echo -e "${CYAN}Backend logs:${NC}"
            tail -n 20 backend/app.log 2>/dev/null || echo "No backend logs found"
            echo ""
            echo -e "${CYAN}Frontend logs:${NC}"
            tail -n 20 frontend/.next/trace 2>/dev/null || echo "No frontend logs found"
            ;;
        "help"|"-h"|"--help")
            echo -e "${CYAN}AI Travel Concierge Platform - Setup & Management Script${NC}"
            echo ""
            echo -e "${YELLOW}Usage:${NC}"
            echo "  $0 [command]"
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo -e "  ${GREEN}setup${NC}     - Install dependencies and create config files only"
            echo -e "  ${GREEN}start${NC}     - Setup and start both backend and frontend servers (default)"
            echo -e "  ${GREEN}stop${NC}      - Stop all running servers"
            echo -e "  ${GREEN}restart${NC}   - Restart all servers"
            echo -e "  ${GREEN}status${NC}    - Check if servers are running"
            echo -e "  ${GREEN}logs${NC}      - Show recent logs from both servers"
            echo -e "  ${GREEN}help${NC}      - Show this help message"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 setup     # Install dependencies only"
            echo "  $0 start     # Start all services"
            echo "  $0 status    # Check server status"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information."
            exit 1
            ;;
    esac
}

if [ ! -x "$0" ]; then
    chmod +x "$0"
fi

main "$@" 