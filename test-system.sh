#!/bin/bash

echo "🎫 Testing Ticket Booking System..."
echo ""

# Test 1: Check API Gateway
echo "1️⃣ Testing API Gateway..."
curl -s http://localhost:3000/events > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API Gateway is running on port 3000"
else
    echo "❌ API Gateway is not responding"
    exit 1
fi

# Test 2: Get Events
echo ""
echo "2️⃣ Fetching sample events..."
curl -s http://localhost:3000/events | head -c 200
echo ""

# Test 3: Register a user
echo ""
echo "3️⃣ Registering a test user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "tier": "regular"
  }')

echo "User registration response:"
echo $USER_RESPONSE | head -c 200
echo ""

# Test 4: Login user
echo ""
echo "4️⃣ Logging in the test user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login response:"
echo $LOGIN_RESPONSE | head -c 200
echo ""

echo ""
echo "🎉 System testing complete!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000/events in your browser"
echo "2. Use the API endpoints to register users and book tickets"
echo "3. Check the README.md for complete API documentation" 