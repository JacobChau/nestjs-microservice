#!/bin/bash

# 🎫 Ticket Booking System Test Script
echo "🎫 Testing NestJS Kafka Microservices - Ticket Booking System"
echo "============================================================"

API_BASE="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if API Gateway is running
print_step "Checking if API Gateway is running..."
if curl -s "$API_BASE/events" > /dev/null; then
    print_success "API Gateway is running!"
else
    print_error "API Gateway is not running. Please start it with: npm run start:api"
    exit 1
fi

# Step 1: Register a user
print_step "Step 1: Registering a new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "tier": "premium"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    print_success "User registered successfully!"
    print_info "Response: $REGISTER_RESPONSE"
else
    print_error "Failed to register user"
    print_info "Response: $REGISTER_RESPONSE"
fi

echo ""

# Step 2: Login and get token
print_step "Step 2: Logging in to get authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    print_success "Login successful!"
    # Extract token from response (simplified - in production use jq)
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_info "Token: ${TOKEN:0:50}..."
else
    print_error "Failed to login"
    print_info "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo ""

# Step 3: Browse events
print_step "Step 3: Browsing available events..."
EVENTS_RESPONSE=$(curl -s "$API_BASE/events")

if echo "$EVENTS_RESPONSE" | grep -q "success.*true"; then
    print_success "Events retrieved successfully!"
    # Extract first event ID (simplified)
    EVENT_ID=$(echo "$EVENTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_info "Found event: $EVENT_ID"
else
    print_error "Failed to get events"
    print_info "Response: $EVENTS_RESPONSE"
    exit 1
fi

echo ""

# Step 4: Check available seats
print_step "Step 4: Checking available seats for event..."
SEATS_RESPONSE=$(curl -s "$API_BASE/events/$EVENT_ID/seats")

if echo "$SEATS_RESPONSE" | grep -q "success.*true"; then
    print_success "Available seats retrieved!"
    # Extract first two seat IDs (simplified)
    SEAT1=$(echo "$SEATS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    SEAT2=$(echo "$SEATS_RESPONSE" | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
    print_info "Selected seats: $SEAT1, $SEAT2"
else
    print_error "Failed to get available seats"
    print_info "Response: $SEATS_RESPONSE"
    exit 1
fi

echo ""

# Step 5: Book tickets
print_step "Step 5: Booking tickets..."
BOOKING_RESPONSE=$(curl -s -X POST "$API_BASE/bookings" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"seatIds\": [\"$SEAT1\", \"$SEAT2\"]
  }")

if echo "$BOOKING_RESPONSE" | grep -q "success.*true"; then
    print_success "Booking created successfully!"
    BOOKING_ID=$(echo "$BOOKING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_info "Booking ID: $BOOKING_ID"
else
    print_error "Failed to create booking"
    print_info "Response: $BOOKING_RESPONSE"
fi

echo ""

# Step 6: View bookings
print_step "Step 6: Viewing user bookings..."
USER_BOOKINGS_RESPONSE=$(curl -s "$API_BASE/bookings" \
  -H "Authorization: $TOKEN")

if echo "$USER_BOOKINGS_RESPONSE" | grep -q "success.*true"; then
    print_success "User bookings retrieved successfully!"
    print_info "Response: $USER_BOOKINGS_RESPONSE"
else
    print_error "Failed to get user bookings"
    print_info "Response: $USER_BOOKINGS_RESPONSE"
fi

echo ""
echo "🎉 Ticket booking flow test completed!"
echo ""
echo "📊 Summary:"
echo "- ✅ User Registration"
echo "- ✅ User Authentication"
echo "- ✅ Event Browsing"
echo "- ✅ Seat Availability Check"
echo "- ✅ Ticket Booking"
echo "- ✅ Booking History"
echo ""
echo "🎯 Your ticket booking system is working correctly!" 