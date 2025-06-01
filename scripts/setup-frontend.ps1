# 🎨 Frontend Setup Script for Windows
# PowerShell script to set up the React/Next.js frontend

Write-Host "🎨 Setting up Frontend for Seminar Demo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Check if Node.js is installed
Write-Status "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
    
    if ($versionNumber -lt 18) {
        Write-Error "Node.js version 18 or higher is required. Current version: $nodeVersion"
        Write-Status "Download from: https://nodejs.org/"
        exit 1
    }
    
    Write-Success "Node.js $nodeVersion detected"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
    Write-Status "Download from: https://nodejs.org/"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Success "npm $npmVersion detected"
} catch {
    Write-Error "npm is not available"
    exit 1
}

# Navigate to frontend directory
Write-Status "Setting up frontend in apps\frontend..."
if (-not (Test-Path "apps\frontend")) {
    Write-Error "Frontend directory apps\frontend does not exist"
    exit 1
}

Push-Location "apps\frontend"

try {
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }

    # Create environment file
    Write-Status "Creating environment configuration..."
    $envContent = @"
# Frontend Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Success "Environment file created"

    # Create next-env.d.ts file for TypeScript
    Write-Status "Setting up TypeScript environment..."
    $nextEnvContent = @"
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
"@
    $nextEnvContent | Out-File -FilePath "next-env.d.ts" -Encoding UTF8

    # Build the project to check for errors
    Write-Status "Building frontend to verify setup..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend built successfully"
    } else {
        Write-Warning "Build encountered issues, but frontend should still work in development mode"
    }

} finally {
    Pop-Location
}

Write-Success "🎉 Frontend setup completed!"

Write-Host ""
Write-Host "📱 Frontend Information:" -ForegroundColor Cyan
Write-Host "  • Technology: Next.js 14 + React 18 + TypeScript"
Write-Host "  • UI Framework: Tailwind CSS"
Write-Host "  • Real-time: Socket.io (planned)"
Write-Host "  • Location: apps\frontend\"
Write-Host "  • Port: 3001"

Write-Host ""
Write-Host "🚀 How to start the frontend:" -ForegroundColor Cyan
Write-Host "  1. Start backend services: docker-compose up -d"
Write-Host "  2. Run database setup: .\scripts\setup-windows.ps1"
Write-Host "  3. Start frontend: cd apps\frontend; npm run dev"
Write-Host "  4. Open browser: http://localhost:3001"

Write-Host ""
Write-Host "🎮 Demo Features:" -ForegroundColor Cyan
Write-Host "  • 🎵 Event selection with real-time availability"
Write-Host "  • 🪑 Interactive seat map with different tiers (VIP/Premium/Regular)"
Write-Host "  • 👥 User switching (Alice/Bob/Carol/Admin with different tiers)"
Write-Host "  • 💳 Complete booking flow (Reserve → Pay → Confirm)"
Write-Host "  • ⏰ Reservation timeouts (30 seconds in demo)"
Write-Host "  • 📊 Real-time activity log"
Write-Host "  • 🔄 Auto-refresh capabilities"

Write-Host ""
Write-Host "🛠️ Troubleshooting:" -ForegroundColor Cyan
Write-Host "  • If port 3001 is busy: npm run dev -- -p 3002"
Write-Host "  • If API errors: Check backend services with docker-compose logs"
Write-Host "  • If missing packages: npm install"
Write-Host "  • For permission issues: Run PowerShell as Administrator" 