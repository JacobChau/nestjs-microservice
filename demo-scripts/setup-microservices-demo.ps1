# Microservices + Kafka Seminar Demo Setup
# Focused 4-demo setup following SEMINAR_DEMO_GUIDE.md

Write-Host "Microservices + Kafka Seminar Demo Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Following SEMINAR_DEMO_GUIDE.md - 4 focused scenarios" -ForegroundColor Yellow

$baseUrl = "http://localhost:3000"

function Call-API($url, $method = "GET", $body = $null) {
    try {
        if ($body) {
            $json = $body | ConvertTo-Json
            return Invoke-RestMethod -Uri $url -Method $method -Body $json -ContentType "application/json"
        } else {
            return Invoke-RestMethod -Uri $url -Method $method
        }
    } catch {
        return $null
    }
}

Write-Host "Checking microservices..." -ForegroundColor Blue
$check = Call-API "$baseUrl/events"
if (-not $check) {
    Write-Host "ERROR: Services not running. Please start them first:" -ForegroundColor Red
    Write-Host "  docker-compose up -d" -ForegroundColor Yellow
    Write-Host "  npm run start:all" -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: All microservices operational" -ForegroundColor Green

Write-Host "Setting up 3 demo users (Alice, Bob, Charlie)..." -ForegroundColor Blue
$users = @(
    @{ email = "alice@demo.com"; name = "Alice Johnson"; password = "demo123"; phone = "+1234567001"; tier = "premium" },
    @{ email = "bob@demo.com"; name = "Bob Smith"; password = "demo123"; phone = "+1234567002"; tier = "regular" },
    @{ email = "charlie@demo.com"; name = "Charlie Wilson"; password = "demo123"; phone = "+1234567003"; tier = "vip" }
)

$userNames = @("Alice (Premium)", "Bob (Regular)", "Charlie (VIP)")
$tokens = @{}

for ($i = 0; $i -lt $users.Length; $i++) {
    # Register (will fail if user exists, that's ok)
    Call-API "$baseUrl/auth/register" "POST" $users[$i] | Out-Null
    
    # Login
    $login = @{ email = $users[$i].email; password = "demo123" }
    $result = Call-API "$baseUrl/auth/login" "POST" $login
    
    if ($result -and $result.data -and $result.data.token) {
        $tokens[$users[$i].email] = $result.data.token
        Write-Host "SUCCESS: $($userNames[$i]) authenticated" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed: $($userNames[$i])" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Getting Taylor Swift concert event..." -ForegroundColor Blue
$events = Call-API "$baseUrl/events"
$eventId = ""

if ($events -and $events.data -and $events.data.Count -gt 0) {
    $eventId = $events.data[0].id
    Write-Host "SUCCESS: Using existing event: $($events.data[0].name)" -ForegroundColor Green
} else {
    Write-Host "Creating Taylor Swift concert for demo..." -ForegroundColor Yellow
    $event = @{
        name = "Taylor Swift - The Eras Tour"
        venue = "Madison Square Garden" 
        date = "2024-06-15T20:00:00Z"
        totalSeats = 100
        price = 150
        description = "Experience the magic of Taylor Swift's greatest hits"
        category = "Concert"
    }
    
    $newEvent = Call-API "$baseUrl/events" "POST" $event
    if ($newEvent -and $newEvent.data -and $newEvent.data.id) {
        $eventId = $newEvent.data.id
        Write-Host "SUCCESS: Taylor Swift concert created for demo" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to create event" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Creating Postman environment..." -ForegroundColor Blue

$env = @{
    id = "seminar-demo-env"
    name = "Microservices + Kafka Seminar Demo"
    values = @(
        @{ key = "baseUrl"; value = $baseUrl; type = "default"; enabled = $true }
        @{ key = "eventId"; value = $eventId; type = "default"; enabled = $true }
        @{ key = "user1Token"; value = $tokens["alice@demo.com"]; type = "secret"; enabled = $true }
        @{ key = "user2Token"; value = $tokens["bob@demo.com"]; type = "secret"; enabled = $true }
        @{ key = "user3Token"; value = $tokens["charlie@demo.com"]; type = "secret"; enabled = $true }
    )
    "_postman_variable_scope" = "environment"
}

$json = $env | ConvertTo-Json -Depth 4
$json | Out-File -FilePath "demo-scripts/seminar-demo.postman_environment.json" -Encoding UTF8

Write-Host ""
Write-Host "SUCCESS: Seminar Demo Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Import These Files in Postman:" -ForegroundColor Cyan
Write-Host "1. Collection: microservices-kafka-demo-collection.json" -ForegroundColor White
Write-Host "2. Environment: demo-scripts/seminar-demo.postman_environment.json" -ForegroundColor White
Write-Host ""
Write-Host "4 FOCUSED DEMOS (15 minutes total):" -ForegroundColor Cyan
Write-Host "1. Demo 1: Concurrent Booking Conflict (5 min)" -ForegroundColor White
Write-Host "   -> 3 users click same seat simultaneously" -ForegroundColor Gray
Write-Host "   -> Only 1 wins, Kafka prevents double-booking" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Demo 2: Booking Timeout and Recovery (5 min)" -ForegroundColor White
Write-Host "   -> User reserves seat but doesn't pay" -ForegroundColor Gray
Write-Host "   -> System automatically releases seat" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Demo 3: Payment Flow and State Management (5 min)" -ForegroundColor White
Write-Host "   -> Complete booking process: reserve -> pay -> confirm" -ForegroundColor Gray
Write-Host "   -> Clear state transitions and audit trail" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Demo 4: Service Resilience (3 min)" -ForegroundColor White
Write-Host "   -> Simulate service crash during operation" -ForegroundColor Gray
Write-Host "   -> Show graceful error handling" -ForegroundColor Gray
Write-Host ""
Write-Host "Key Benefits Demonstrated:" -ForegroundColor Yellow
Write-Host "* Kafka message ordering prevents race conditions" -ForegroundColor White
Write-Host "* Automatic timeout handling prevents stuck inventory" -ForegroundColor White
Write-Host "* Complete audit trail of all booking changes" -ForegroundColor White
Write-Host "* Fault isolation keeps system running during failures" -ForegroundColor White
Write-Host ""
Write-Host "Perfect for seminars: Shows real problems -> real solutions!" -ForegroundColor Green 