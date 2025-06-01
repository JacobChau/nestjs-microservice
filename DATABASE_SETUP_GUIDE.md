# 🗃️ Database Setup Guide - Migrations & Seeding

## 🎯 **Overview**

This guide shows you how to set up proper database migrations and seeding for your NestJS microservices project. We've implemented a production-ready database setup with:

- **TypeORM migrations** for PostgreSQL (Auth & Booking services)
- **MongoDB seeding** for Event service
- **Automated scripts** for easy management
- **Proper indexing** for performance
- **Audit trails** for compliance

---

## 🏗️ **Architecture Overview**

### **Database Distribution**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │ Booking Service │    │ Event Service   │
│                 │    │                 │    │                 │
│   PostgreSQL    │    │   PostgreSQL    │    │    MongoDB      │
│  users_demo     │    │ bookings_demo   │    │  events_demo    │
│                 │    │                 │    │                 │
│ • users table   │    │ • bookings      │    │ • events coll.  │
│ • migrations    │    │ • booking_audit │    │ • seats coll.   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Why This Setup?**
- **PostgreSQL**: ACID transactions for users and financial data
- **MongoDB**: Flexible schema for events and seat configurations
- **Separate databases**: Independent scaling and maintenance

---

## 📁 **File Structure**

```
nestjs-microservice/
├── apps/
│   ├── auth-service/
│   │   ├── src/migrations/
│   │   │   └── 1703123456789-CreateUsersTable.ts
│   │   ├── src/seeds/
│   │   │   └── user.seed.ts
│   │   └── ormconfig.ts
│   ├── booking-service/
│   │   ├── src/migrations/
│   │   │   └── 1703123456790-CreateBookingsTable.ts
│   │   └── ormconfig.ts
│   └── event-service/
│       └── src/seeds/
│           └── event.seed.ts
└── scripts/
    ├── run-migrations.sh
    ├── run-seeds.sh
    ├── check-databases.sh
    └── reset-databases.sh
```

---

## 🚀 **Quick Setup (3 Commands)**

### **Option 1: Fresh Setup**
```bash
# 1. Start databases
docker-compose up -d postgres-db mongodb-db

# 2. Run migrations (creates tables)
./scripts/run-migrations.sh

# 3. Run seeds (loads demo data)
./scripts/run-seeds.sh
```

### **Option 2: Complete Reset**
```bash
# Reset everything and start fresh
./scripts/reset-databases.sh
```

---

## 🔧 **Manual Setup (Step by Step)**

### **Step 1: Start Databases**
```bash
# Start PostgreSQL and MongoDB
docker-compose up -d postgres-db mongodb-db

# Verify they're running
docker ps | grep -E "(postgres|mongo)"
```

### **Step 2: Run PostgreSQL Migrations**
```bash
# Auth Service
cd apps/auth-service
npx typeorm migration:run -d ormconfig.ts

# Booking Service  
cd ../booking-service
npx typeorm migration:run -d ormconfig.ts
cd ../..
```

### **Step 3: Run Seeds**
```bash
# Auth Service (PostgreSQL)
cd apps/auth-service
npx ts-node -e "
import { DataSource } from 'typeorm';
import ormConfig from './ormconfig';
import { UserSeeder } from './src/seeds/user.seed';

async function run() {
  const dataSource = await ormConfig.initialize();
  const seeder = new UserSeeder(dataSource);
  await seeder.run();
  await dataSource.destroy();
}
run();
"

# Event Service (MongoDB)
cd ../event-service
npx ts-node -e "
import { NestFactory } from '@nestjs/core';
import { EventModule } from './src/event.module';
import { EventSeeder } from './src/seeds/event.seed';

async function run() {
  const app = await NestFactory.createApplicationContext(EventModule);
  const seeder = app.get(EventSeeder);
  await seeder.run();
  await app.close();
}
run();
"
cd ../..
```

---

## 📊 **What Gets Created**

### **PostgreSQL Tables**

#### **Users Table (auth-service)**
```sql
CREATE TABLE users (
    db_id SERIAL PRIMARY KEY,
    id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tier VARCHAR(20) DEFAULT 'regular',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_tier ON users(tier);
```

#### **Bookings Table (booking-service)**
```sql
CREATE TABLE bookings (
    db_id SERIAL PRIMARY KEY,
    id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    seat_ids TEXT[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit table for compliance
CREATE TABLE booking_audit (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    amount DECIMAL(10,2),
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

### **MongoDB Collections**

#### **Events Collection**
```javascript
{
  id: "event_1703123456789_abc123def",
  name: "Taylor Swift - The Eras Tour",
  venue: "Madison Square Garden",
  date: ISODate("2024-06-15T20:00:00Z"),
  totalSeats: 100,
  availableSeats: 100,
  price: 150,
  description: "Experience the magic...",
  category: "Concert",
  status: "upcoming"
}
```

#### **Seats Collection**
```javascript
{
  id: "event_1703123456789_abc123def_A1",
  eventId: "event_1703123456789_abc123def",
  row: "A",
  number: 1,
  status: "available", // available, reserved, booked
  price: 225, // VIP pricing
  type: "vip" // regular, premium, vip
}
```

---

## 🌱 **Seed Data Overview**

### **Users (50+ demo users)**
- **demo1@test.com** / demo123 (regular tier)
- **demo2@test.com** / demo123 (premium tier)  
- **demo3@test.com** / demo123 (vip tier)
- **admin@test.com** / admin123 (vip tier)
- **taylor.swift@music.com** / swiftie123 (vip tier)
- **testuser5-50@test.com** / test123 (various tiers)

### **Events (5 demo events)**
- **Taylor Swift - The Eras Tour** (100 seats, $150)
- **Ed Sheeran - Mathematics Tour** (80 seats, $120)
- **Local Jazz Night** (50 seats, $45)
- **Rock Festival 2024** (200 seats, $75)
- **Classical Symphony Night** (60 seats, $200)

### **Seats (490+ total seats)**
- **VIP seats**: First 2 rows (1.5x price)
- **Premium seats**: Next 2 rows (1.25x price)
- **Regular seats**: Remaining rows (base price)

---

## 🛠️ **Management Commands**

### **Check Database Status**
```bash
./scripts/check-databases.sh
```
Shows:
- Connection status
- Table/collection counts
- Data distribution
- Sample records

### **Reset Everything**
```bash
./scripts/reset-databases.sh
```
- Drops all databases
- Recreates them
- Runs migrations
- Loads seed data

### **Manual Database Access**
```bash
# PostgreSQL
docker exec -it postgres-db psql -U postgres

# MongoDB
docker exec -it mongodb-db mongosh

# Check specific database
docker exec -it postgres-db psql -U postgres -d users_demo
docker exec -it mongodb-db mongosh events_demo
```

---

## 🔍 **Verification Commands**

### **Check PostgreSQL Data**
```sql
-- Connect to users database
\c users_demo

-- Check users
SELECT tier, COUNT(*) FROM users GROUP BY tier;

-- Connect to bookings database  
\c bookings_demo

-- Check bookings
SELECT status, COUNT(*) FROM bookings GROUP BY status;
```

### **Check MongoDB Data**
```javascript
// Connect to events database
use events_demo

// Check events
db.events.find().count()
db.events.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])

// Check seats
db.seats.find().count()
db.seats.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

---

## 🚨 **Troubleshooting**

### **Migration Errors**
```bash
# Check if databases exist
docker exec postgres-db psql -U postgres -l

# Create databases manually if needed
docker exec postgres-db psql -U postgres -c "CREATE DATABASE users_demo;"
docker exec postgres-db psql -U postgres -c "CREATE DATABASE bookings_demo;"

# Check migration status
cd apps/auth-service
npx typeorm migration:show -d ormconfig.ts
```

### **Seed Errors**
```bash
# Check if tables exist
docker exec postgres-db psql -U postgres -d users_demo -c "\dt"

# Check MongoDB connection
docker exec mongodb-db mongosh --eval "db.runCommand('ping')"

# Clear and re-seed
./scripts/reset-databases.sh
```

### **Connection Issues**
```bash
# Check if containers are running
docker ps | grep -E "(postgres|mongo)"

# Check logs
docker logs postgres-db
docker logs mongodb-db

# Restart containers
docker-compose restart postgres-db mongodb-db
```

---

## 🎯 **Production Considerations**

### **Environment Variables**
```bash
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=users_demo

# MongoDB
MONGODB_URI=mongodb://mongo:mongo@localhost:27017/events_demo?authSource=admin
```

### **Security**
- Change default passwords
- Use environment variables
- Enable SSL/TLS
- Restrict database access
- Regular backups

### **Performance**
- Monitor index usage
- Optimize queries
- Connection pooling
- Database monitoring
- Regular maintenance

---

## 🎉 **Next Steps**

1. **Start Services**: `docker-compose up -d`
2. **Test APIs**: `curl http://localhost:3000/events`
3. **Run Demo**: `./demo-scripts/seminar-setup.sh`
4. **Load Test**: Use the Postman collection
5. **Monitor**: Check logs and performance

---

**🎭 Your database setup is now production-ready with proper migrations, seeding, and management tools!** 