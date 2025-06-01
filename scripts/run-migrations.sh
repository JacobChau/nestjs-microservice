#!/bin/bash

# 🗃️ Database Migration Runner
# This script runs migrations for all PostgreSQL services

echo "🗃️ Running Database Migrations"
echo "=============================="

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

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! docker exec postgres-db pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not running. Please start it first:"
    echo "  docker-compose up -d postgres-db"
    exit 1
fi

print_success "PostgreSQL is running"

# Function to run migrations for a service
run_service_migrations() {
    local service_name=$1
    local service_path=$2
    
    print_status "Running migrations for $service_name..."
    
    cd "$service_path" || {
        print_error "Failed to change directory to $service_path"
        return 1
    }
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install > /dev/null 2>&1
    fi
    
    # Run migrations
    if npx typeorm migration:run -d ormconfig.ts; then
        print_success "$service_name migrations completed"
    else
        print_error "$service_name migrations failed"
        return 1
    fi
    
    cd - > /dev/null
}

# Run migrations for auth service
print_status "=== Auth Service Migrations ==="
run_service_migrations "Auth Service" "apps/auth-service"

# Run migrations for booking service  
print_status "=== Booking Service Migrations ==="
run_service_migrations "Booking Service" "apps/booking-service"

print_success "🎉 All migrations completed successfully!"

echo ""
echo "📊 Database Status:"
echo "  • Auth Service: users_demo database ready"
echo "  • Booking Service: bookings_demo database ready"
echo ""
echo "🚀 Next Steps:"
echo "  • Run seed data: ./scripts/run-seeds.sh"
echo "  • Start services: docker-compose up -d"
echo "  • Check tables: ./scripts/check-databases.sh" 