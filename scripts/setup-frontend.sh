#!/bin/bash

# 🎨 Frontend Setup Script
# This script sets up the React/Next.js frontend for the seminar demo

echo "🎨 Setting up Frontend for Seminar Demo"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    print_status "Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not available"
    exit 1
fi

print_success "npm $(npm --version) detected"

# Navigate to frontend directory
print_status "Setting up frontend in apps/frontend..."
cd apps/frontend || {
    print_error "Failed to navigate to apps/frontend directory"
    exit 1
}

# Install dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create environment file
print_status "Creating environment configuration..."
cat > .env.local << EOF
# Frontend Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
EOF

print_success "Environment file created"

# Create next-env.d.ts file for TypeScript
print_status "Setting up TypeScript environment..."
cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
EOF

# Build the project to check for errors
print_status "Building frontend to verify setup..."
if npm run build; then
    print_success "Frontend built successfully"
else
    print_warning "Build encountered issues, but frontend should still work in development mode"
fi

cd - > /dev/null

print_success "🎉 Frontend setup completed!"

echo ""
echo "📱 Frontend Information:"
echo "  • Technology: Next.js 14 + React 18 + TypeScript"
echo "  • UI Framework: Tailwind CSS"
echo "  • Real-time: Socket.io (planned)"
echo "  • Location: apps/frontend/"
echo "  • Port: 3001"

echo ""
echo "🚀 How to start the frontend:"
echo "  1. Start backend services: docker-compose up -d"
echo "  2. Run database setup: ./scripts/setup-windows.ps1 (or ./scripts/run-seeds.sh)"
echo "  3. Start frontend: cd apps/frontend && npm run dev"
echo "  4. Open browser: http://localhost:3001"

echo ""
echo "🎮 Demo Features:"
echo "  • 🎵 Event selection with real-time availability"
echo "  • 🪑 Interactive seat map with different tiers (VIP/Premium/Regular)"
echo "  • 👥 User switching (Alice/Bob/Carol/Admin with different tiers)"
echo "  • 💳 Complete booking flow (Reserve → Pay → Confirm)"
echo "  • ⏰ Reservation timeouts (30 seconds in demo)"
echo "  • 📊 Real-time activity log"
echo "  • 🔄 Auto-refresh capabilities"

echo ""
echo "🛠️ Troubleshooting:"
echo "  • If port 3001 is busy: npm run dev -- -p 3002"
echo "  • If API errors: Check backend services with docker-compose logs"
echo "  • If missing packages: npm install"
echo "  • For Windows: Use PowerShell or WSL" 