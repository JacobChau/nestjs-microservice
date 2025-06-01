#!/bin/bash

# 🎪 Complete Seminar Demo Startup Script
# This script starts the entire system for the seminar presentation

echo "🎪 Starting Complete Seminar Demo"
echo "================================"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is required but not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is required but not installed"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is required but not installed"
    exit 1
fi

print_success "All prerequisites found"

# Start databases
print_status "Starting database services..."
docker-compose up -d postgres-db mongo-db kafka zookeeper

# Wait for databases to be ready
print_status "Waiting for databases to start (30 seconds)..."
sleep 30

# Check database health
print_status "Checking database health..."
if ! docker exec postgres-db pg_isready -U postgres > /dev/null 2>&1; then
    print_error "PostgreSQL is not ready"
    exit 1
fi

if ! docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_error "MongoDB is not ready"
    exit 1
fi

print_success "Databases are ready"

# Run database setup if not already done
print_status "Setting up databases (migrations & seeds)..."
if ./scripts/run-migrations.sh && ./scripts/run-seeds.sh; then
    print_success "Database setup completed"
else
    print_warning "Database setup had issues, but continuing..."
fi

# Start microservices
print_status "Starting microservices..."
docker-compose up -d api-gateway auth-service event-service booking-service

# Wait for services to be ready
print_status "Waiting for microservices to start (20 seconds)..."
sleep 20

# Check service health
print_status "Checking service health..."
for i in {1..10}; do
    if curl -s http://localhost:3000/events > /dev/null 2>&1; then
        print_success "API Gateway is responding"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "API Gateway is not responding after 10 attempts"
        exit 1
    fi
    print_status "Waiting for API Gateway... (attempt $i/10)"
    sleep 3
done

# Setup frontend if not already done
if [ ! -d "apps/frontend/node_modules" ]; then
    print_status "Setting up frontend for first time..."
    ./scripts/setup-frontend.sh
else
    print_status "Frontend already set up"
fi

# Start frontend in background
print_status "Starting frontend..."
cd apps/frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd - > /dev/null

# Wait for frontend to start
print_status "Waiting for frontend to start (10 seconds)..."
sleep 10

# Check if frontend is responding
for i in {1..5}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_success "Frontend is responding"
        break
    fi
    if [ $i -eq 5 ]; then
        print_warning "Frontend may not be ready yet, but should start soon"
    fi
    sleep 2
done

print_success "🎉 Complete demo system is running!"

echo ""
echo "🌐 Access Points:"
echo "  • Frontend (Main Demo): http://localhost:3001"
echo "  • API Gateway: http://localhost:3000"
echo "  • Swagger Docs: http://localhost:3000/api"

echo ""
echo "🎮 Quick Demo Test:"
echo "  1. Open: http://localhost:3001"
echo "  2. Select a user from dropdown (top right)"
echo "  3. Click on an event (left panel)"
echo "  4. Click on an available seat (middle panel)"
echo "  5. Click 'Reserve Seat' (right panel)"

echo ""
echo "🎯 Seminar Demo Scenarios:"
echo "  • Concurrent Booking: Open 3 browser windows, different users, same seat"
echo "  • Timeout Demo: Reserve seat, wait 30 seconds without paying"
echo "  • User Tiers: Switch users to see different seat access"
echo "  • Activity Log: Watch real-time updates in bottom-left panel"

echo ""
echo "📊 System Status:"
docker-compose ps

echo ""
echo "🛑 To stop everything:"
echo "  docker-compose down"
echo "  kill $FRONTEND_PID  # Stop frontend"

echo ""
echo "🔍 Troubleshooting:"
echo "  • Check logs: docker-compose logs [service-name]"
echo "  • Reset databases: ./scripts/reset-databases.sh"
echo "  • Check database status: ./scripts/check-databases.sh"
echo "  • Frontend logs: cd apps/frontend && npm run dev"

# Keep the script running to show status
echo ""
print_status "Demo is running. Press Ctrl+C to see shutdown instructions."

# Trap Ctrl+C
trap 'echo ""; print_warning "To stop the demo:"; echo "  docker-compose down"; echo "  kill $FRONTEND_PID"; exit 0' INT

# Keep running
while true; do
    sleep 10
    # Quick health check
    if ! curl -s http://localhost:3000/events > /dev/null 2>&1; then
        print_error "API Gateway stopped responding!"
        break
    fi
    if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_warning "Frontend stopped responding!"
    fi
done 