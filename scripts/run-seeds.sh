#!/bin/bash

# 🌱 Database Seeding Runner
# This script runs seeds for all database services

echo "🌱 Running Database Seeds"
echo "========================="

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

# Check if databases are running
print_status "Checking database connections..."

# Check PostgreSQL
if ! docker exec postgres-db pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not running. Please start it first:"
    echo "  docker-compose up -d postgres-db"
    exit 1
fi

# Check MongoDB (correct container name)
if ! docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_error "MongoDB is not running. Please start it first:"
    echo "  docker-compose up -d mongo-db"
    exit 1
fi

print_success "All databases are running"

# Function to create seed runner script
create_seed_runner() {
    local service_name=$1
    local service_path=$2
    local seed_file=$3
    
    cat > "$service_path/run-seed.ts" << EOF
import { DataSource } from 'typeorm';
import ormConfig from './ormconfig';
import { ${seed_file} } from './src/seeds/${seed_file,,}.seed';

async function runSeed() {
  try {
    console.log('🌱 Initializing database connection...');
    const dataSource = await ormConfig.initialize();
    
    console.log('🌱 Running ${service_name} seeds...');
    const seeder = new ${seed_file}(dataSource);
    await seeder.run();
    
    console.log('✅ ${service_name} seeding completed');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ ${service_name} seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
EOF
}

# Function to create MongoDB seed runner
create_mongo_seed_runner() {
    local service_path=$1
    
    cat > "$service_path/run-seed.ts" << EOF
import { NestFactory } from '@nestjs/core';
import { EventModule } from './src/event.module';
import { EventSeeder } from './src/seeds/event.seed';

async function runSeed() {
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

runSeed();
EOF
}

# Function to run seeds for a PostgreSQL service
run_postgres_seeds() {
    local service_name=$1
    local service_path=$2
    local seed_class=$3
    
    print_status "Running seeds for $service_name..."
    
    cd "$service_path" || {
        print_error "Failed to change directory to $service_path"
        return 1
    }
    
    # Create seed runner
    create_seed_runner "$service_name" "." "$seed_class"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install > /dev/null 2>&1
    fi
    
    # Run seeds
    if npx ts-node run-seed.ts; then
        print_success "$service_name seeds completed"
        rm -f run-seed.ts
    else
        print_error "$service_name seeds failed"
        rm -f run-seed.ts
        return 1
    fi
    
    cd - > /dev/null
}

# Function to run MongoDB seeds
run_mongo_seeds() {
    local service_name=$1
    local service_path=$2
    
    print_status "Running seeds for $service_name..."
    
    cd "$service_path" || {
        print_error "Failed to change directory to $service_path"
        return 1
    }
    
    # Create seed runner
    create_mongo_seed_runner "."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install > /dev/null 2>&1
    fi
    
    # Run seeds
    if npx ts-node run-seed.ts; then
        print_success "$service_name seeds completed"
        rm -f run-seed.ts
    else
        print_error "$service_name seeds failed"
        rm -f run-seed.ts
        return 1
    fi
    
    cd - > /dev/null
}

# Run seeds for all services
print_status "=== Auth Service Seeds ==="
run_postgres_seeds "Auth Service" "apps/auth-service" "UserSeeder"

print_status "=== Event Service Seeds ==="
run_mongo_seeds "Event Service" "apps/event-service"

print_success "🎉 All seeds completed successfully!"

echo ""
echo "📊 Seeded Data Summary:"
echo "  • Users: 50+ demo users (demo1-3@test.com, admin@test.com, etc.)"
echo "  • Events: 5 demo events (Taylor Swift, Ed Sheeran, Jazz Night, etc.)"
echo "  • Seats: 490+ seats across all events with different tiers"
echo ""
echo "🚀 Next Steps:"
echo "  • Start services: docker-compose up -d"
echo "  • Test API: curl http://localhost:3000/events"
echo "  • Run demo: ./demo-scripts/seminar-setup.sh"
echo ""
echo "🔑 Demo Login Credentials:"
echo "  • demo1@test.com / demo123 (regular tier)"
echo "  • demo2@test.com / demo123 (premium tier)"
echo "  • demo3@test.com / demo123 (vip tier)"
echo "  • admin@test.com / admin123 (vip tier)" 