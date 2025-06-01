# 🗃️ Database Setup Script for Windows
# PowerShell script to run migrations and seeds

Write-Host "🗃️ Database Setup for Windows" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

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

# Check if Docker is running
Write-Status "Checking Docker..."
try {
    docker ps | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Start databases
Write-Status "Starting databases..."
docker-compose up -d postgres-db mongo-db

# Wait for databases to be ready
Write-Status "Waiting for databases to start (30 seconds)..."
Start-Sleep -Seconds 30

# Check PostgreSQL
Write-Status "Checking PostgreSQL connection..."
$pgReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        docker exec postgres-db pg_isready -U postgres | Out-Null
        $pgReady = $true
        break
    } catch {
        Write-Status "Waiting for PostgreSQL... (attempt $i/10)"
        Start-Sleep -Seconds 3
    }
}

if (-not $pgReady) {
    Write-Error "PostgreSQL is not responding"
    exit 1
}

Write-Success "PostgreSQL is ready"

# Check MongoDB (correct container name and authentication)
Write-Status "Checking MongoDB connection..."
$mongoReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" | Out-Null
        $mongoReady = $true
        break
    } catch {
        Write-Status "Waiting for MongoDB... (attempt $i/10)"
        Start-Sleep -Seconds 3
    }
}

if (-not $mongoReady) {
    Write-Error "MongoDB is not responding"
    exit 1
}

Write-Success "MongoDB is ready"

# Create databases
Write-Status "Creating databases..."
docker exec postgres-db psql -U postgres -c "CREATE DATABASE IF NOT EXISTS users_demo;" 2>$null
docker exec postgres-db psql -U postgres -c "CREATE DATABASE IF NOT EXISTS bookings_demo;" 2>$null

# Run migrations
Write-Status "=== Running Migrations ==="

Write-Status "Running Auth Service migrations..."
Push-Location "apps\auth-service"
try {
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install | Out-Null
    }
    npx typeorm migration:run -d ormconfig.ts
    Write-Success "Auth Service migrations completed"
} catch {
    Write-Error "Auth Service migrations failed: $_"
    Pop-Location
    exit 1
}
Pop-Location

Write-Status "Running Booking Service migrations..."
Push-Location "apps\booking-service"
try {
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install | Out-Null
    }
    npx typeorm migration:run -d ormconfig.ts
    Write-Success "Booking Service migrations completed"
} catch {
    Write-Error "Booking Service migrations failed: $_"
    Pop-Location
    exit 1
}
Pop-Location

# Run seeds
Write-Status "=== Running Seeds ==="

Write-Status "Running Auth Service seeds..."
Push-Location "apps\auth-service"
try {
    $seedScript = @"
import { DataSource } from 'typeorm';
import ormConfig from './ormconfig';
import { UserSeeder } from './src/seeds/user.seed';

async function run() {
  try {
    console.log('🌱 Initializing database connection...');
    const dataSource = await ormConfig.initialize();
    
    console.log('🌱 Running Auth Service seeds...');
    const seeder = new UserSeeder(dataSource);
    await seeder.run();
    
    console.log('✅ Auth Service seeding completed');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Auth Service seeding failed:', error);
    process.exit(1);
  }
}

run();
"@
    $seedScript | Out-File -FilePath "run-seed.ts" -Encoding UTF8
    npx ts-node run-seed.ts
    Remove-Item "run-seed.ts"
    Write-Success "Auth Service seeds completed"
} catch {
    Write-Error "Auth Service seeds failed: $_"
    Pop-Location
    exit 1
}
Pop-Location

Write-Status "Running Event Service seeds..."
Push-Location "apps\event-service"
try {
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install | Out-Null
    }
    
    $seedScript = @"
import { NestFactory } from '@nestjs/core';
import { EventModule } from './src/event.module';
import { EventSeeder } from './src/seeds/event.seed';

async function run() {
  try {
    console.log('🌱 Initializing NestJS application...');
    const app = await NestFactory.createApplicationContext(EventModule);
    
    console.log('🌱 Running Event Service seeds...');
    const seeder = app.get(EventSeeder);
    await seeder.run();
    
    console.log('✅ Event Service seeding completed');
    await app.close();
  } catch (error) {
    console.error('❌ Event Service seeding failed:', error);
    process.exit(1);
  }
}

run();
"@
    $seedScript | Out-File -FilePath "run-seed.ts" -Encoding UTF8
    npx ts-node run-seed.ts
    Remove-Item "run-seed.ts"
    Write-Success "Event Service seeds completed"
} catch {
    Write-Error "Event Service seeds failed: $_"
    Pop-Location
    exit 1
}
Pop-Location

Write-Success "🎉 Database setup completed successfully!"

Write-Host ""
Write-Host "📊 Seeded Data Summary:" -ForegroundColor Cyan
Write-Host "  • Users: 50+ demo users (demo1-3@test.com, admin@test.com, etc.)"
Write-Host "  • Events: 5 demo events (Taylor Swift, Ed Sheeran, Jazz Night, etc.)"
Write-Host "  • Seats: 490+ seats across all events with different tiers"

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  • Start services: docker-compose up -d"
Write-Host "  • Test API: curl http://localhost:3000/events"
Write-Host "  • Run demo: .\demo-scripts\seminar-setup.sh"

Write-Host ""
Write-Host "🔑 Demo Login Credentials:" -ForegroundColor Cyan
Write-Host "  • demo1@test.com / demo123 (regular tier)"
Write-Host "  • demo2@test.com / demo123 (premium tier)"
Write-Host "  • demo3@test.com / demo123 (vip tier)"
Write-Host "  • admin@test.com / admin123 (vip tier)"

Write-Host ""
Write-Host "🛠️ Management Commands:" -ForegroundColor Cyan
Write-Host "  • Check status: .\scripts\check-databases.ps1"
Write-Host "  • Reset all: .\scripts\reset-databases.ps1" 