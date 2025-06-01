#!/bin/bash

# 🎭 Demo Setup Script for Scalable Ticket Booking System
# This script prepares the environment for the presentation demo

echo "🎭 Setting up Demo Environment for Scalable Ticket Booking System"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "All prerequisites are installed"

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose down --remove-orphans

# Clean up any existing data
print_status "Cleaning up existing data..."
docker volume prune -f

# Build and start services
print_status "Building and starting all services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
print_status "Checking service health..."

services=("api-gateway" "auth-service" "booking-service" "event-service" "kafka" "zookeeper")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose ps | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    print_error "Some services are not running. Check docker-compose logs for details."
    exit 1
fi

# Wait a bit more for Kafka to be fully ready
print_status "Waiting for Kafka to be fully ready..."
sleep 15

# Create Kafka topics
print_status "Creating Kafka topics..."
docker exec kafka kafka-topics --create --topic event.create --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic booking.create --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic seat.reserved --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic user.registered --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists

print_success "Kafka topics created"

# Seed demo data
print_status "Seeding demo data..."

# Wait for API Gateway to be ready
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3000/events > /dev/null 2>&1; then
        print_success "API Gateway is ready"
        break
    else
        print_status "Waiting for API Gateway... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "API Gateway is not responding after $max_attempts attempts"
    exit 1
fi

# Create demo events using the API
print_status "Creating demo events..."

# Taylor Swift Concert
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Taylor Swift - The Eras Tour",
    "venue": "Madison Square Garden",
    "date": "2024-06-15T20:00:00Z",
    "totalSeats": 100,
    "price": 150,
    "description": "Experience the magic of Taylor Swift'\''s greatest hits spanning her entire career",
    "category": "Concert"
  }' > /dev/null

# Ed Sheeran Concert
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ed Sheeran - Mathematics Tour",
    "venue": "Wembley Stadium",
    "date": "2024-07-20T19:30:00Z",
    "totalSeats": 80,
    "price": 120,
    "description": "An intimate acoustic performance by Ed Sheeran",
    "category": "Concert"
  }' > /dev/null

# Jazz Night
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Jazz Night",
    "venue": "Blue Note Jazz Club",
    "date": "2024-05-25T21:00:00Z",
    "totalSeats": 50,
    "price": 45,
    "description": "A cozy evening with local jazz musicians",
    "category": "Jazz"
  }' > /dev/null

print_success "Demo events created"

# Create some demo users
print_status "Creating demo users..."

for i in {1..10}; do
    curl -s -X POST http://localhost:3000/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"demo$i@example.com\",
        \"name\": \"Demo User $i\",
        \"password\": \"demo123\",
        \"tier\": \"regular\"
      }" > /dev/null
done

print_success "Demo users created"

# Install demo script dependencies
print_status "Installing demo script dependencies..."
if [ ! -d "node_modules" ]; then
    npm install axios > /dev/null 2>&1
fi

print_success "Dependencies installed"

# Verify API endpoints
print_status "Verifying API endpoints..."

endpoints=(
    "GET http://localhost:3000/events"
    "POST http://localhost:3000/auth/login"
)

for endpoint in "${endpoints[@]}"; do
    method=$(echo $endpoint | cut -d' ' -f1)
    url=$(echo $endpoint | cut -d' ' -f2)
    
    if [ "$method" = "GET" ]; then
        if curl -s "$url" > /dev/null; then
            print_success "$endpoint - OK"
        else
            print_error "$endpoint - FAILED"
        fi
    fi
done

# Show system status
print_status "System Status Summary:"
echo ""
echo "🐳 Docker Containers:"
docker-compose ps

echo ""
echo "📊 Kafka Topics:"
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

echo ""
echo "🎯 API Endpoints Available:"
echo "  • Events API: http://localhost:3000/events"
echo "  • Auth API: http://localhost:3000/auth"
echo "  • Bookings API: http://localhost:3000/bookings"

echo ""
echo "📱 Demo Tools:"
echo "  • Postman Collection: postman-collection.json"
echo "  • Load Simulator: npx ts-node load-simulator.ts [users]"
echo "  • Multi-Event Test: node demo-scripts/multi-event-load-test.js"
echo "  • Real-time Monitor: open demo-scripts/realtime-monitor.html"

echo ""
echo "🎬 Demo Commands:"
echo "  • Flash Sale Demo: npx ts-node load-simulator.ts 100"
echo "  • Multi-Event Demo: node demo-scripts/multi-event-load-test.js"
echo "  • Service Resilience: docker-compose stop booking-service"
echo "  • Monitor Kafka: docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic booking.create"

echo ""
print_success "🎉 Demo environment is ready!"
print_status "You can now start your presentation. All services are running and demo data is loaded."

echo ""
echo "🚀 Quick Start Commands:"
echo "  1. Open Postman and import: postman-collection.json"
echo "  2. Open browser: demo-scripts/realtime-monitor.html"
echo "  3. Run load test: npx ts-node load-simulator.ts 50"
echo "  4. Monitor Kafka: docker logs -f kafka"

echo ""
print_warning "Note: If you encounter any issues, run 'docker-compose logs [service-name]' to check logs" 