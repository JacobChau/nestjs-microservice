# Database Status Checker for Windows
# PowerShell script to check database status

Write-Host "Database Status Check" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Check PostgreSQL
Write-Status "=== PostgreSQL Status ==="
try {
    docker exec postgres-db pg_isready -U postgres | Out-Null
    Write-Success "PostgreSQL is running"
    
    # Check users database
    Write-Status "Checking users_demo database..."
    $userCount = docker exec postgres-db psql -U postgres -d users_demo -t -c "SELECT COUNT(*) FROM users;" 2>$null
    if ($userCount) {
        $userCount = $userCount.Trim()
        Write-Success "users_demo database: $userCount users found"
        
        # Show user distribution by tier
        Write-Host "User distribution by tier:"
        docker exec postgres-db psql -U postgres -d users_demo -c "SELECT tier, COUNT(*) as count FROM users GROUP BY tier ORDER BY tier;" 2>$null
    } else {
        Write-Warning "users_demo database: No users found or database not accessible"
    }
    
    # Check bookings database
    Write-Status "Checking bookings_demo database..."
    $bookingCount = docker exec postgres-db psql -U postgres -d bookings_demo -t -c "SELECT COUNT(*) FROM bookings;" 2>$null
    if ($bookingCount) {
        $bookingCount = $bookingCount.Trim()
        Write-Success "bookings_demo database: $bookingCount bookings found"
    } else {
        Write-Warning "bookings_demo database: No bookings found or database not accessible"
    }
    
} catch {
    Write-Error "PostgreSQL is not running"
}

Write-Host ""

# Check MongoDB
Write-Status "=== MongoDB Status ==="
try {
    docker exec mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin --eval "db.runCommand('ping')" | Out-Null
    Write-Success "MongoDB is running"
    
    # Check events collection
    Write-Status "Checking events collection..."
    $eventCount = docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.events.countDocuments()" --quiet 2>$null
    if ($eventCount -and $eventCount -ne "0") {
        Write-Success "events collection: $eventCount events found"
        
        # Show event distribution by category
        Write-Host "Event distribution by category:"
        docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.events.aggregate([{ `$group: { _id: '`$category', count: { `$sum: 1 } } }, { `$sort: { _id: 1 } }])" --quiet 2>$null
    } else {
        Write-Warning "events collection: No events found or collection not accessible"
    }
    
    # Check seats collection
    Write-Status "Checking seats collection..."
    $seatCount = docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.seats.countDocuments()" --quiet 2>$null
    if ($seatCount -and $seatCount -ne "0") {
        Write-Success "seats collection: $seatCount seats found"
        
        # Show seat distribution by status
        Write-Host "Seat distribution by status:"
        docker exec mongo-db mongosh events_demo --username mongo --password mongo --authenticationDatabase admin --eval "db.seats.aggregate([{ `$group: { _id: '`$status', count: { `$sum: 1 } } }, { `$sort: { _id: 1 } }])" --quiet 2>$null
    } else {
        Write-Warning "seats collection: No seats found or collection not accessible"
    }
    
} catch {
    Write-Error "MongoDB is not running"
}

Write-Host ""

# Summary
Write-Status "=== Database Summary ==="
Write-Host "Data Overview:" -ForegroundColor Cyan
Write-Host "  - PostgreSQL (users_demo): $userCount users"
Write-Host "  - PostgreSQL (bookings_demo): $bookingCount bookings"
Write-Host "  - MongoDB (events_demo): $eventCount events, $seatCount seats"

Write-Host ""
Write-Host "Connection Details:" -ForegroundColor Cyan
Write-Host "  - PostgreSQL: localhost:5432 (postgres/postgres)"
Write-Host "  - MongoDB: localhost:27017 (mongo/mongo)"

Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "  - Reset all data: .\scripts\reset-databases.ps1"
Write-Host "  - Re-run migrations: .\scripts\run-migrations.ps1"
Write-Host "  - Re-run seeds: .\scripts\run-seeds.ps1"
Write-Host "  - Connect to PostgreSQL: docker exec -it postgres-db psql -U postgres"
Write-Host "  - Connect to MongoDB: docker exec -it mongo-db mongosh --username mongo --password mongo --authenticationDatabase admin" 