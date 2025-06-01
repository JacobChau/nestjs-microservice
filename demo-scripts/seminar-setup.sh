#!/bin/bash

# 🎭 Seminar Demo Setup - Simple & Focused
# This script sets up a minimal demo environment for seminar presentation

echo "🎭 Setting up Seminar Demo Environment"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[NOTE]${NC} $1"
}

# Start services
print_status "Starting microservices..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start (30 seconds)..."
sleep 30

# Wait for API Gateway to be ready
print_status "Waiting for API Gateway to be ready..."
max_attempts=20
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3000/events > /dev/null 2>&1; then
        print_success "API Gateway is ready"
        break
    else
        print_status "Waiting for API Gateway... (attempt $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ API Gateway is not responding. Please check docker-compose logs"
    exit 1
fi

# Create demo event
print_status "Creating Taylor Swift Concert event..."
EVENT_RESPONSE=$(curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Taylor Swift Concert",
    "venue": "Madison Square Garden",
    "date": "2024-06-15T20:00:00Z",
    "totalSeats": 10,
    "price": 150,
    "description": "The Eras Tour - Limited Seats!",
    "category": "Concert"
  }')

# Extract event ID from response
EVENT_ID=$(echo $EVENT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$EVENT_ID" ]; then
    print_success "Event created with ID: $EVENT_ID"
    echo "export EVENT_ID=$EVENT_ID" > .demo-env
else
    print_warning "Could not extract event ID, using default"
    echo "export EVENT_ID=event_default" > .demo-env
fi

# Create demo users
print_status "Creating demo users..."

for i in {1..3}; do
    curl -s -X POST http://localhost:3000/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"demo$i@test.com\",
        \"name\": \"Demo User $i\",
        \"password\": \"demo123\",
        \"tier\": \"regular\"
      }" > /dev/null
done

print_success "Created 3 demo users (demo1@test.com, demo2@test.com, demo3@test.com)"

# Create login tokens for easy demo
print_status "Creating login tokens for demo users..."

for i in {1..3}; do
    TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"demo$i@test.com\",
        \"password\": \"demo123\"
      }")
    
    TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "export USER${i}_TOKEN=$TOKEN" >> .demo-env
        print_success "User $i token created"
    fi
done

# Show demo environment
echo ""
print_success "🎉 Seminar Demo Environment Ready!"
echo ""
echo "📊 Demo Data Created:"
echo "  • 1 Event: Taylor Swift Concert (10 seats)"
echo "  • 3 Users: demo1@test.com, demo2@test.com, demo3@test.com"
echo "  • All services running and ready"
echo ""
echo "🎯 API Endpoints:"
echo "  • Events: http://localhost:3000/events"
echo "  • Bookings: http://localhost:3000/bookings"
echo "  • Auth: http://localhost:3000/auth"
echo ""
echo "🎬 Demo Tools:"
echo "  • Postman Collection: postman-collection.json"
echo "  • Real-time Monitor: demo-scripts/realtime-monitor.html"
echo "  • Demo Guide: SEMINAR_DEMO_GUIDE.md"
echo ""
echo "🚀 Quick Demo Commands:"
echo ""
echo "# Load environment variables"
echo "source .demo-env"
echo ""
echo "# Demo 1: Concurrent Booking (use 3 Postman tabs)"
echo "POST http://localhost:3000/bookings"
echo "Headers: Authorization: \$USER1_TOKEN"
echo "Body: {\"eventId\":\"\$EVENT_ID\",\"seatIds\":[\"A1\"]}"
echo ""
echo "# Demo 2: Check seat availability"
echo "GET http://localhost:3000/events/\$EVENT_ID/seats"
echo ""
echo "# Demo 3: Service resilience"
echo "docker-compose stop booking-service"
echo "# Try booking (will show error)"
echo "docker-compose start booking-service"
echo "# Try booking again (will work)"
echo ""
echo "# Demo 4: Real-time updates"
echo "# Open demo-scripts/realtime-monitor.html in multiple browser windows"
echo "# Book seats using Postman and watch real-time updates"
echo ""
print_warning "Environment variables saved to .demo-env - run 'source .demo-env' to load them"
print_warning "Open SEMINAR_DEMO_GUIDE.md for detailed demo instructions"

# Show service status
echo ""
echo "🐳 Service Status:"
docker-compose ps

echo ""
print_success "Ready for seminar presentation! 🎭" 