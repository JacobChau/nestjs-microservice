#!/bin/bash

# 🔄 Database Reset Script
# This script completely resets all databases and re-runs migrations and seeds

echo "🔄 Database Reset"
echo "================"

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

# Confirmation prompt
print_warning "⚠️  This will completely reset all databases and data!"
print_warning "All existing users, events, bookings, and seats will be deleted."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Reset cancelled."
    exit 0
fi

# Check if databases are running
print_status "Checking database connections..."

# Check PostgreSQL
if ! docker exec postgres-db pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not running. Please start it first:"
    echo "  docker-compose up -d postgres-db"
    exit 1
fi

# Check MongoDB (correct container name and authentication)
if ! docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_error "MongoDB is not running. Please start it first:"
    echo "  docker-compose up -d mongo-db"
    exit 1
fi

print_success "All databases are running"

# Reset PostgreSQL databases
print_status "=== Resetting PostgreSQL Databases ==="

print_status "Dropping and recreating users_demo database..."
docker exec postgres-db psql -U postgres -c "DROP DATABASE IF EXISTS users_demo;" > /dev/null 2>&1
docker exec postgres-db psql -U postgres -c "CREATE DATABASE users_demo;" > /dev/null 2>&1
print_success "users_demo database reset"

print_status "Dropping and recreating bookings_demo database..."
docker exec postgres-db psql -U postgres -c "DROP DATABASE IF EXISTS bookings_demo;" > /dev/null 2>&1
docker exec postgres-db psql -U postgres -c "CREATE DATABASE bookings_demo;" > /dev/null 2>&1
print_success "bookings_demo database reset"

# Reset MongoDB database
print_status "=== Resetting MongoDB Database ==="

print_status "Dropping events_demo database..."
docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "use events_demo; db.dropDatabase();" > /dev/null 2>&1
print_success "events_demo database reset"

# Run migrations
print_status "=== Running Migrations ==="
if ./scripts/run-migrations.sh; then
    print_success "Migrations completed"
else
    print_error "Migrations failed"
    exit 1
fi

# Run seeds
print_status "=== Running Seeds ==="
if ./scripts/run-seeds.sh; then
    print_success "Seeds completed"
else
    print_error "Seeds failed"
    exit 1
fi

print_success "🎉 Database reset completed successfully!"

echo ""
echo "📊 Fresh Database Status:"
echo "  • PostgreSQL databases recreated and migrated"
echo "  • MongoDB database recreated"
echo "  • All seed data loaded"

echo ""
echo "🚀 Next Steps:"
echo "  • Check status: ./scripts/check-databases.sh"
echo "  • Start services: docker-compose up -d"
echo "  • Run demo: ./demo-scripts/seminar-setup.sh"

echo ""
echo "🔑 Demo Login Credentials:"
echo "  • demo1@test.com / demo123 (regular tier)"
echo "  • demo2@test.com / demo123 (premium tier)"
echo "  • demo3@test.com / demo123 (vip tier)"
echo "  • admin@test.com / admin123 (vip tier)" 