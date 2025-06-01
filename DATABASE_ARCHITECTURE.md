# 🗄️ Database Architecture - Ticket Booking System

## 📊 **Optimized Database Design**

This document explains the strategic database choices for our ticket booking system, optimizing for performance, scalability, and data consistency.

## 🎯 **Database Selection Strategy**

### **MongoDB (Document Store)**
**Best for**: Flexible schema, read-heavy operations, complex nested data

### **PostgreSQL (Relational)**
**Best for**: ACID transactions, financial data, referential integrity

---

## 🎭 **MongoDB - Event Service**

### **Why MongoDB for Events & Seats?**

✅ **Flexible Schema**: Events have varying metadata (venue details, categories, descriptions)  
✅ **Read-Heavy Operations**: Users browse events frequently, few writes  
✅ **Complex Nested Data**: Seat layouts, pricing tiers, venue configurations  
✅ **Horizontal Scaling**: Easy to shard by event location or date  
✅ **Fast Queries**: Optimized for "find available events" queries  

### **Data Models**

#### **Events Collection**
```javascript
{
  _id: ObjectId("..."),
  id: "event_1703123456789_abc123def",
  name: "Taylor Swift - The Eras Tour",
  venue: {
    name: "Madison Square Garden",
    address: "4 Pennsylvania Plaza, New York, NY",
    capacity: 20000,
    layout: "arena"
  },
  date: ISODate("2024-06-15T20:00:00Z"),
  totalSeats: 100,
  availableSeats: 85,
  pricing: {
    base: 150,
    vip: 225,
    premium: 180
  },
  description: "Experience the magic of Taylor Swift's greatest hits",
  category: "Concert",
  tags: ["pop", "stadium-tour", "sold-out-risk"],
  status: "upcoming",
  metadata: {
    artist: {
      name: "Taylor Swift",
      genre: "Pop",
      socialMedia: {...}
    },
    venue: {
      amenities: ["parking", "food-court", "accessibility"],
      rules: ["no-cameras", "bag-check"]
    }
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### **Seats Collection**
```javascript
{
  _id: ObjectId("..."),
  id: "event_1703123456789_abc123def_A1",
  eventId: "event_1703123456789_abc123def",
  section: {
    name: "A",
    type: "vip",
    row: "A",
    number: 1
  },
  position: {
    x: 10,
    y: 5,
    floor: 1
  },
  status: "available", // available, reserved, booked
  price: 225,
  type: "vip",
  features: ["premium-view", "early-entry", "meet-greet"],
  reservedUntil: null,
  reservedBy: null,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### **MongoDB Advantages for Events**

🚀 **Performance Benefits**:
- **Fast Aggregations**: Complex event filtering and sorting
- **Geospatial Queries**: Find events near user location
- **Text Search**: Full-text search across event names, descriptions
- **Flexible Indexing**: Compound indexes on date, location, category

📈 **Scalability Benefits**:
- **Horizontal Sharding**: Shard by geographic region or date
- **Read Replicas**: Scale read operations for event browsing
- **Caching-Friendly**: Document structure maps well to API responses

---

## 💳 **PostgreSQL - Auth & Booking Services**

### **Why PostgreSQL for Users & Bookings?**

✅ **ACID Transactions**: Critical for financial operations  
✅ **Referential Integrity**: Ensure data consistency across tables  
✅ **Complex Queries**: Join operations for booking analytics  
✅ **Financial Compliance**: Audit trails and data integrity  
✅ **Concurrent Safety**: Handle multiple booking attempts safely  

### **Database Schema**

#### **Users Database (`users_demo`)**
```sql
-- Users table with authentication data
CREATE TABLE users (
    db_id SERIAL PRIMARY KEY,
    id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tier VARCHAR(20) DEFAULT 'regular' CHECK (tier IN ('regular', 'premium', 'vip')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_tier ON users(tier);
```

#### **Bookings Database (`bookings_demo`)**
```sql
-- Bookings table with financial transaction data
CREATE TABLE bookings (
    db_id SERIAL PRIMARY KEY,
    id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    seat_ids TEXT[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and integrity
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Audit table for financial compliance
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

### **PostgreSQL Advantages for Bookings**

🔒 **Transaction Safety**:
- **ACID Compliance**: Ensures booking consistency
- **Row-Level Locking**: Prevents double-booking
- **Rollback Support**: Undo failed transactions
- **Isolation Levels**: Control concurrent access

📊 **Analytics & Reporting**:
- **Complex Joins**: User behavior analysis
- **Aggregations**: Revenue reporting, popular events
- **Window Functions**: Ranking, running totals
- **JSON Support**: Flexible metadata storage

---

## ⚡ **Performance Optimizations**

### **MongoDB Optimizations**

#### **Indexing Strategy**
```javascript
// Events collection indexes
db.events.createIndex({ "date": 1, "status": 1 })
db.events.createIndex({ "category": 1, "date": 1 })
db.events.createIndex({ "venue.name": 1 })
db.events.createIndex({ "name": "text", "description": "text" })

// Seats collection indexes
db.seats.createIndex({ "eventId": 1, "status": 1 })
db.seats.createIndex({ "eventId": 1, "type": 1, "status": 1 })
db.seats.createIndex({ "reservedUntil": 1 }, { sparse: true })
```

#### **Aggregation Pipelines**
```javascript
// Find popular events with available seats
db.events.aggregate([
  { $match: { status: "upcoming", availableSeats: { $gt: 0 } } },
  { $lookup: {
      from: "seats",
      localField: "id",
      foreignField: "eventId",
      as: "seats"
  }},
  { $addFields: {
      availableSeatsCount: {
        $size: { $filter: {
          input: "$seats",
          cond: { $eq: ["$$this.status", "available"] }
        }}
      }
  }},
  { $sort: { date: 1 } },
  { $limit: 20 }
])
```

### **PostgreSQL Optimizations**

#### **Query Optimization**
```sql
-- Efficient booking queries with proper indexes
EXPLAIN ANALYZE
SELECT b.*, u.name, u.email, u.tier
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.status = 'confirmed'
  AND b.created_at >= NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC;

-- Booking analytics with window functions
SELECT 
    event_id,
    COUNT(*) as total_bookings,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_booking_value,
    RANK() OVER (ORDER BY SUM(total_amount) DESC) as revenue_rank
FROM bookings 
WHERE status = 'confirmed'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY event_id;
```

#### **Connection Pooling**
```typescript
// Optimized TypeORM configuration
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'demo',
  password: 'demo123',
  database: 'bookings_demo',
  entities: [BookingEntity],
  synchronize: false, // Use migrations in production
  logging: ['error'],
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
})
```

---

## 🔄 **Data Flow & Consistency**

### **Cross-Database Operations**

#### **Booking Flow with Dual Database**
```typescript
async createBooking(createBookingDto: CreateBookingDto, userId: string) {
  // 1. Check seat availability in MongoDB
  const seats = await this.mongoSeatService.getAvailableSeats(eventId);
  
  // 2. Reserve seats in MongoDB (with TTL)
  await this.mongoSeatService.reserveSeats(eventId, seatIds, userId);
  
  try {
    // 3. Create booking record in PostgreSQL
    const booking = await this.postgresBookingRepo.save({
      userId,
      eventId,
      seatIds,
      totalAmount,
      status: 'pending'
    });
    
    // 4. Publish Kafka event for consistency
    this.kafkaClient.emit('booking.requested', {
      bookingId: booking.id,
      eventId,
      seatIds,
      userId
    });
    
    return booking;
  } catch (error) {
    // 5. Rollback seat reservation on failure
    await this.mongoSeatService.releaseSeats(seatIds, eventId);
    throw error;
  }
}
```

### **Eventual Consistency via Kafka**

#### **Event-Driven Synchronization**
```typescript
// Seat reservation events
@EventPattern('seat.reserved')
async handleSeatReserved(data: SeatReservedEvent) {
  // Update analytics in MongoDB
  await this.analyticsService.recordSeatReservation(data);
}

@EventPattern('booking.confirmed')
async handleBookingConfirmed(data: BookingConfirmedEvent) {
  // Confirm seats in MongoDB
  await this.seatService.confirmSeats(data.seatIds);
  
  // Update user tier in PostgreSQL
  await this.userService.updateUserActivity(data.userId);
}
```

---

## 📈 **Scaling Strategy**

### **MongoDB Scaling**
- **Sharding**: By event date or geographic region
- **Read Replicas**: For event browsing and search
- **Caching**: Redis for frequently accessed events

### **PostgreSQL Scaling**
- **Read Replicas**: For analytics and reporting
- **Connection Pooling**: PgBouncer for connection management
- **Partitioning**: Partition bookings by date

### **Hybrid Benefits**
- **Specialized Optimization**: Each database optimized for its use case
- **Independent Scaling**: Scale databases based on specific load patterns
- **Technology Flexibility**: Use best tool for each data type

---

## 🎯 **Summary**

| Data Type | Database | Reason | Benefits |
|-----------|----------|---------|----------|
| **Events & Seats** | MongoDB | Flexible schema, read-heavy, complex nested data | Fast queries, easy scaling, flexible structure |
| **Users** | PostgreSQL | Authentication, referential integrity | ACID transactions, security, data consistency |
| **Bookings** | PostgreSQL | Financial transactions, audit trails | Transaction safety, complex analytics, compliance |

This architecture provides the **best of both worlds**: MongoDB's flexibility for content-heavy data and PostgreSQL's reliability for transactional data. 