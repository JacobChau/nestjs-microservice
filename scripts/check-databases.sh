#!/bin/bash

# 🔍 Database Status Checker
# This script checks the status of all databases and shows table/collection info

echo "🔍 Database Status Check"
echo "======================="

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

# Check PostgreSQL
print_status "=== PostgreSQL Status ==="
if docker exec postgres-db pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is running"
    
    # Check users database
    print_status "Checking users_demo database..."
    USER_COUNT=$(docker exec postgres-db psql -U postgres -d users_demo -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    if [ "$USER_COUNT" ]; then
        print_success "users_demo database: $USER_COUNT users found"
        
        # Show user distribution by tier
        echo "User distribution by tier:"
        docker exec postgres-db psql -U postgres -d users_demo -c "
        SELECT tier, COUNT(*) as count 
        FROM users 
        GROUP BY tier 
        ORDER BY tier;" 2>/dev/null | grep -E "(regular|premium|vip|[0-9])"
    else
        print_warning "users_demo database: No users found or database not accessible"
    fi
    
    # Check bookings database
    print_status "Checking bookings_demo database..."
    BOOKING_COUNT=$(docker exec postgres-db psql -U postgres -d bookings_demo -t -c "SELECT COUNT(*) FROM bookings;" 2>/dev/null | xargs)
    if [ "$BOOKING_COUNT" ]; then
        print_success "bookings_demo database: $BOOKING_COUNT bookings found"
        
        # Show booking distribution by status
        echo "Booking distribution by status:"
        docker exec postgres-db psql -U postgres -d bookings_demo -c "
        SELECT status, COUNT(*) as count 
        FROM bookings 
        GROUP BY status 
        ORDER BY status;" 2>/dev/null | grep -E "(pending|confirmed|cancelled|refunded|[0-9])"
    else
        print_warning "bookings_demo database: No bookings found or database not accessible"
    fi
    
    # Show table structures
    print_status "PostgreSQL table structures:"
    echo "Users table:"
    docker exec postgres-db psql -U postgres -d users_demo -c "\d users" 2>/dev/null | head -20
    
    echo ""
    echo "Bookings table:"
    docker exec postgres-db psql -U postgres -d bookings_demo -c "\d bookings" 2>/dev/null | head -20
    
else
    print_error "PostgreSQL is not running"
fi

echo ""

# Check MongoDB (correct container name and authentication)
print_status "=== MongoDB Status ==="
if docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is running"
    
    # Check events collection
    print_status "Checking events collection..."
    EVENT_COUNT=$(docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.events.countDocuments()" --quiet 2>/dev/null | tail -1)
    if [ "$EVENT_COUNT" ] && [ "$EVENT_COUNT" != "0" ]; then
        print_success "events collection: $EVENT_COUNT events found"
        
        # Show event distribution by category
        echo "Event distribution by category:"
        docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "
        db.events.aggregate([
          { \$group: { _id: '\$category', count: { \$sum: 1 } } },
          { \$sort: { _id: 1 } }
        ])" --quiet 2>/dev/null | grep -E "(_id|count)"
    else
        print_warning "events collection: No events found or collection not accessible"
    fi
    
    # Check seats collection
    print_status "Checking seats collection..."
    SEAT_COUNT=$(docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.seats.countDocuments()" --quiet 2>/dev/null | tail -1)
    if [ "$SEAT_COUNT" ] && [ "$SEAT_COUNT" != "0" ]; then
        print_success "seats collection: $SEAT_COUNT seats found"
        
        # Show seat distribution by status
        echo "Seat distribution by status:"
        docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "
        db.seats.aggregate([
          { \$group: { _id: '\$status', count: { \$sum: 1 } } },
          { \$sort: { _id: 1 } }
        ])" --quiet 2>/dev/null | grep -E "(_id|count)"
        
        # Show seat distribution by type
        echo "Seat distribution by type:"
        docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "
        db.seats.aggregate([
          { \$group: { _id: '\$type', count: { \$sum: 1 } } },
          { \$sort: { _id: 1 } }
        ])" --quiet 2>/dev/null | grep -E "(_id|count)"
    else
        print_warning "seats collection: No seats found or collection not accessible"
    fi
    
    # Show sample documents
    print_status "MongoDB sample documents:"
    echo "Sample event:"
    docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.events.findOne()" --quiet 2>/dev/null | head -15
    
    echo ""
    echo "Sample seat:"
    docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.seats.findOne()" --quiet 2>/dev/null | head -10
    
else
    print_error "MongoDB is not running"
fi

echo ""

# Summary
print_status "=== Database Summary ==="
echo "📊 Data Overview:"
echo "  • PostgreSQL (users_demo): $USER_COUNT users"
echo "  • PostgreSQL (bookings_demo): $BOOKING_COUNT bookings"
echo "  • MongoDB (events_demo): $EVENT_COUNT events, $SEAT_COUNT seats"

echo ""
echo "🔗 Connection Details:"
echo "  • PostgreSQL: localhost:5432 (postgres/postgres)"
echo "  • MongoDB: localhost:27017 (mongo/mongo)"

echo ""
echo "🛠️ Management Commands:"
echo "  • Reset all data: ./scripts/reset-databases.sh"
echo "  • Re-run migrations: ./scripts/run-migrations.sh"
echo "  • Re-run seeds: ./scripts/run-seeds.sh"
echo "  • Connect to PostgreSQL: docker exec -it postgres-db psql -U postgres"
echo "  • Connect to MongoDB: docker exec -it mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin" 