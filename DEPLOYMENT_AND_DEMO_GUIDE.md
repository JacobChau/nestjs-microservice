# Free Deployment Options & Realistic Demo Guide
## Running Your Microservices Presentation Effectively

---

## Free Cloud Deployment Options

### 1. **Railway** (Recommended for Microservices)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy each service separately
railway login
railway init
railway up
```

**Benefits:**
- **$5/month free credit** (enough for demo)
- **Easy microservices deployment**
- **Built-in PostgreSQL, Redis, MongoDB**
- **Automatic HTTPS and domains**
- **Environment variables management**

**Deployment Example:**
```yaml
# railway.json
{
  "deploy": {
    "startCommand": "npm run start:api-gateway",
    "healthcheckPath": "/health"
  }
}
```

### 2. **Render** (Great for Multiple Services)
```yaml
# render.yaml
services:
  - type: web
    name: api-gateway
    env: node
    buildCommand: npm install
    startCommand: npm run start:api-gateway
    
  - type: web
    name: booking-service
    env: node
    buildCommand: npm install
    startCommand: npm run start:booking-service
```

**Benefits:**
- **Free tier with 750 hours/month**
- **Multiple services support**
- **Free PostgreSQL database**
- **Auto-deploy from GitHub**

### 3. **Fly.io** (Docker-Friendly)
```dockerfile
# fly.toml
app = "ticket-booking-microservices"

[build]
  dockerfile = "Dockerfile.api-gateway"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
```

**Benefits:**
- **Free allowance: 3 shared-cpu-1x VMs**
- **Great for Docker containers**
- **Global deployment**
- **Built-in load balancing**

### 4. **Heroku** (Simple but Limited)
```bash
# Deploy each service as separate app
heroku create ticket-booking-api
heroku create ticket-booking-booking
heroku create ticket-booking-payment

# Add Kafka addon
heroku addons:create cloudkarafka:ducky
```

**Benefits:**
- **Easy deployment**
- **Free PostgreSQL**
- **Kafka addon available**
- **Familiar platform**

---

## Realistic Local Demo Scenario

### **Scaled-Down Demo: Local Concert Venue**

Instead of Taylor Swift with 500K users, let's create a realistic demo:

```typescript
// Demo Configuration
const DEMO_CONFIG = {
  event: "Local Jazz Concert",
  venue: "Blue Note Cafe",
  totalSeats: 100,        // Instead of 50,000
  concurrentUsers: 50,    // Instead of 500,000
  ticketPrice: 45.00,     // Instead of $500
  demoUsers: 10,          // Pre-created test users
  simulatedLoad: true     // Automated booking simulation
};
```

### **Demo Data Setup**

```typescript
// Seed data for realistic demo
const DEMO_EVENT = {
  id: "jazz_night_2024",
  name: "Saturday Night Jazz",
  venue: "Blue Note Cafe",
  date: "2024-12-15T20:00:00Z",
  totalSeats: 100,
  availableSeats: 100,
  price: 45.00,
  seats: generateSeats(10, 10) // 10 rows, 10 seats each
};

const DEMO_USERS = [
  { id: "user_001", name: "Alice Johnson", email: "alice@demo.com" },
  { id: "user_002", name: "Bob Smith", email: "bob@demo.com" },
  { id: "user_003", name: "Carol Davis", email: "carol@demo.com" },
  // ... 7 more users
];
```

---

## Load Testing Tools for Demo

### 1. **Artillery.js** (Recommended)
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users per second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50  # 50 users per second
      name: "Peak load"

scenarios:
  - name: "Book tickets"
    weight: 100
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "{{ $randomString() }}@demo.com"
            password: "demo123"
      - post:
          url: "/bookings"
          json:
            eventId: "jazz_night_2024"
            seatIds: ["A{{ $randomInt(1, 10) }}"]
```

**Run the test:**
```bash
npm install -g artillery
artillery run artillery-config.yml
```

### 2. **K6** (More Advanced)
```javascript
// k6-script.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function() {
  // Login
  let loginRes = http.post('http://localhost:3000/auth/login', {
    email: 'demo@example.com',
    password: 'demo123'
  });
  
  check(loginRes, { 'login successful': (r) => r.status === 200 });
  
  // Book ticket
  let bookingRes = http.post('http://localhost:3000/bookings', {
    eventId: 'jazz_night_2024',
    seatIds: [`A${Math.floor(Math.random() * 10) + 1}`]
  });
  
  check(bookingRes, { 'booking successful': (r) => r.status === 201 });
}
```

### 3. **Simple Node.js Load Simulator**
```typescript
// load-simulator.ts
import axios from 'axios';

class LoadSimulator {
  private baseUrl = 'http://localhost:3000';
  private users = 50;
  private duration = 60000; // 1 minute

  async simulateBookingRush() {
    console.log(`🚀 Starting load test: ${this.users} concurrent users`);
    
    const promises = Array.from({ length: this.users }, (_, i) => 
      this.simulateUser(i)
    );
    
    await Promise.all(promises);
    console.log('✅ Load test completed');
  }

  private async simulateUser(userId: number) {
    try {
      // Login
      const loginRes = await axios.post(`${this.baseUrl}/auth/login`, {
        email: `user${userId}@demo.com`,
        password: 'demo123'
      });

      const token = loginRes.data.token;

      // Random delay to simulate real user behavior
      await this.delay(Math.random() * 5000);

      // Book ticket
      const bookingRes = await axios.post(`${this.baseUrl}/bookings`, {
        eventId: 'jazz_night_2024',
        seatIds: [`A${Math.floor(Math.random() * 10) + 1}`]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`✅ User ${userId}: Booking ${bookingRes.data.bookingId}`);
    } catch (error) {
      console.log(`❌ User ${userId}: ${error.response?.data?.message || error.message}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the simulation
new LoadSimulator().simulateBookingRush();
```

---

## Demo Script for Presentation

### **Live Demo Flow (10 minutes)**

#### **Setup (2 minutes)**
```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Start services
npm run start:all

# Terminal 3: Prepare load test
npm install -g artillery
```

#### **Demo Script**

**1. Show the Architecture (1 minute)**
```bash
# Show running services
docker ps
curl http://localhost:3000/health
```

**2. Manual Booking (2 minutes)**
```bash
# Show normal booking flow
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@demo.com", "password": "demo123"}'

# Book a ticket
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"eventId": "jazz_night_2024", "seatIds": ["A5"]}'
```

**3. Load Test Demo (3 minutes)**
```bash
# Start load test
artillery run demo-load-test.yml

# Show real-time metrics
curl http://localhost:3000/metrics
```

**4. Show Kafka Events (2 minutes)**
```bash
# Show Kafka topics
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list

# Show live events
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking.events \
  --from-beginning
```

### **Demo Configuration Files**

#### **demo-load-test.yml**
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Light load"
    - duration: 60
      arrivalRate: 20
      name: "Heavy load"
    - duration: 30
      arrivalRate: 2
      name: "Cool down"

scenarios:
  - name: "Concurrent booking"
    weight: 100
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "demo{{ $randomInt(1, 50) }}@example.com"
            password: "demo123"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/bookings"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            eventId: "jazz_night_2024"
            seatIds: ["{{ $randomString() }}{{ $randomInt(1, 100) }}"]
```

#### **docker-compose.demo.yml**
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.2
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.3.2
    depends_on: [zookeeper]
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  postgres:
    image: postgres:14
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: ticket_booking
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: demo123

  mongodb:
    image: mongo:5
    ports: ["27017:27017"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: demo
      MONGO_INITDB_ROOT_PASSWORD: demo123
```

---

## Presentation Tips

### **1. Set Realistic Expectations**
```markdown
"While we can't simulate 500K users locally, we can demonstrate:
- ✅ Microservices architecture principles
- ✅ Kafka event-driven communication
- ✅ Horizontal scaling capabilities
- ✅ Fault tolerance and resilience
- ✅ Real-time monitoring and metrics"
```

### **2. Use Visual Monitoring**
```bash
# Install monitoring tools
npm install -g clinic
npm install -g autocannon

# Monitor performance
clinic doctor -- node apps/booking-service/main.js
autocannon -c 50 -d 30 http://localhost:3000/bookings
```

### **3. Show Kafka in Action**
```bash
# Real-time event monitoring
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking.events \
  --property print.timestamp=true \
  --property print.key=true
```

### **4. Demonstrate Scaling**
```bash
# Scale booking service
docker-compose up --scale booking-service=3

# Show load balancing
for i in {1..10}; do
  curl http://localhost:3000/health
done
```

---

## Free Deployment Strategy

### **Option 1: Railway (Recommended)**
```bash
# 1. Deploy infrastructure
railway add postgresql
railway add redis

# 2. Deploy services one by one
railway init api-gateway
railway up

railway init booking-service  
railway up

railway init payment-service
railway up
```

### **Option 2: Render + External Kafka**
```yaml
# Use Render for services + CloudKarafka (free tier)
services:
  - name: api-gateway
    type: web
    env: node
    buildCommand: npm install
    startCommand: npm run start:api-gateway
    envVars:
      - key: KAFKA_BROKERS
        value: your-cloudkarafka-url
```

### **Option 3: Mixed Deployment**
- **Frontend/API Gateway**: Vercel (free)
- **Services**: Railway/Render (free tiers)
- **Kafka**: CloudKarafka (free 5MB)
- **Databases**: Railway/Render built-in

---

## Conclusion

### **For Local Demo:**
- Use **50 concurrent users** instead of 500K
- Use **100 seats** instead of 50K
- Use **Artillery.js** for realistic load testing
- Focus on **architecture benefits** rather than scale numbers

### **For Cloud Demo:**
- Deploy to **Railway** or **Render** (free tiers)
- Use **CloudKarafka** for managed Kafka
- Demonstrate **real horizontal scaling**
- Show **actual monitoring dashboards**

### **Key Demo Points:**
1. **Architecture Clarity**: Show clean service separation
2. **Event-Driven Flow**: Demonstrate Kafka message flow
3. **Fault Tolerance**: Kill a service, show system continues
4. **Scaling**: Add service instances during load test
5. **Monitoring**: Real-time metrics and dashboards

The goal is to demonstrate **architectural principles** and **Kafka's value** rather than raw performance numbers. Your audience will understand the concepts even with a scaled-down demo! 