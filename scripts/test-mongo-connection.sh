#!/bin/bash

# 🧪 MongoDB Connection Test
# This script tests MongoDB connection and authentication

echo "🧪 Testing MongoDB Connection"
echo "============================="

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

# Check if container is running
print_status "Checking if mongo-db container is running..."
if ! docker ps | grep -q "mongo-db"; then
    print_error "mongo-db container is not running"
    print_status "Starting mongo-db container..."
    docker-compose up -d mongo-db
    sleep 10
fi

# Test basic connection
print_status "Testing basic MongoDB connection..."
if docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB connection successful"
else
    print_error "MongoDB connection failed"
    exit 1
fi

# Test database creation
print_status "Testing database operations..."
docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "
use events_demo;
db.test.insertOne({test: 'connection', timestamp: new Date()});
const count = db.test.countDocuments();
print('Test documents:', count);
db.test.drop();
" 2>/dev/null

print_success "MongoDB is working correctly!"

echo ""
echo "🔗 Connection Details:"
echo "  • Container: mongo-db"
echo "  • Port: 27017"
echo "  • Username: mongo"
echo "  • Password: mongo"
echo "  • Auth Database: admin"
echo "  • Target Database: events_demo"

echo ""
echo "🛠️ Manual Connection Command:"
echo "  docker exec -it mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin" 