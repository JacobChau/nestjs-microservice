# 🎨 Frontend Seminar Demo Guide

> **Visual Ticket Booking System for Microservices & Kafka Demonstration**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Backend services running (see database setup guides)
- All microservices available on localhost:3000

### Setup Steps

#### Windows (PowerShell)
```powershell
# 1. Setup frontend
.\scripts\setup-frontend.ps1

# 2. Start the frontend
cd apps\frontend
npm run dev

# 3. Open browser
# Navigate to: http://localhost:3001
```

#### Linux/Mac (Bash)
```bash
# 1. Setup frontend
chmod +x scripts/setup-frontend.sh
./scripts/setup-frontend.sh

# 2. Start the frontend
cd apps/frontend
npm run dev

# 3. Open browser
# Navigate to: http://localhost:3001
```

---

## 🎮 Demo Scenarios for Seminar

### 1. **Concurrent Booking Demonstration** (5 minutes)

**Objective**: Show how Kafka prevents double-booking

**Steps**:
1. Open **3 browser windows** side by side
2. Select **different users** in each window:
   - Window 1: Alice (Regular)
   - Window 2: Bob (Premium) 
   - Window 3: Carol (VIP)
3. Select **Taylor Swift Concert**
4. All users try to book **the same seat** (e.g., A1)
5. **Only one succeeds** - others get "seat taken" error

**What to highlight**:
- Kafka message ordering ensures first-come-first-served
- Real-time updates across all windows
- Graceful error handling for conflicts

### 2. **Booking Flow & Timeout Demo** (3 minutes)

**Objective**: Show reservation timeout mechanism

**Steps**:
1. Select a user and event
2. Click "Reserve Seat" - seat turns yellow (reserved)
3. **Wait 30 seconds** without paying
4. Watch seat automatically return to green (available)
5. Try booking from another window - now succeeds

**What to highlight**:
- Prevents abandoned reservations
- Automatic cleanup via timeouts
- Real-time state synchronization

### 3. **User Tier Benefits Demo** (2 minutes)

**Objective**: Show different access levels

**Steps**:
1. Switch to **Alice (Regular tier)**
2. Notice she can only see regular seats
3. Switch to **Carol (VIP tier)**
4. Show she can access all seat types including VIP

**What to highlight**:
- Business logic enforcement
- User experience differentiation
- Microservice authorization

### 4. **Real-time Activity Monitoring** (2 minutes)

**Objective**: Show system transparency

**Steps**:
1. Point out the **Activity Log** panel
2. Perform various actions (select events, book seats)
3. Show how all actions are logged with timestamps
4. Demonstrate error scenarios

**What to highlight**:
- Real-time system monitoring
- Audit trail for compliance
- Debugging capabilities

### 5. **Service Resilience Demo** (3 minutes)

**Objective**: Show system reliability

**Steps**:
1. Start booking process
2. Kill booking service: `docker stop booking-service`
3. Show graceful error handling
4. Restart service: `docker start booking-service`
5. Retry booking - now succeeds

**What to highlight**:
- Graceful degradation
- Service independence
- Auto-recovery capabilities

---

## 🎯 Key Demo Talking Points

### **Microservices Benefits Demonstrated**

1. **Independent Scaling**
   - Frontend connects to API Gateway
   - Each service can scale independently
   - Show in Network tab: calls to different endpoints

2. **Service Isolation**
   - Event service failure doesn't affect auth
   - Booking service restart doesn't break seat viewing
   - Database per service pattern

3. **Technology Diversity**
   - Frontend: React/Next.js
   - Gateway: NestJS
   - Events: MongoDB
   - Users: PostgreSQL

### **Kafka Benefits Demonstrated**

1. **Message Ordering**
   - First booking request wins
   - Concurrent attempts properly serialized
   - No race conditions

2. **Event Sourcing**
   - All state changes via events
   - Activity log shows event stream
   - Audit trail for compliance

3. **Loose Coupling**
   - Services communicate via events
   - No direct service-to-service calls
   - Easy to add new services

4. **Durability**
   - Events survive service restarts
   - No data loss during failures
   - Reliable message delivery

---

## 🎨 UI Features Explained

### **Dashboard Layout**
```
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
│  📅 Events      │  🪑 Seat Map   │  💳 Booking    │
│  • Taylor Swift │  • Visual seats │  • User info    │
│  • Ed Sheeran   │  • Color coded  │  • Price calc   │
│  • Jazz Night   │  • Interactive  │  • Payment flow │
│                 │                 │                 │
├─────────────────┴─────────────────┴─────────────────┤
│                                                     │
│  📊 Activity Log                                   │
│  • Real-time updates                               │
│  • Color-coded messages                            │
│  • Timestamp tracking                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Color Coding System**
- **🟢 Green**: Available seats
- **🟡 Yellow**: Reserved seats (payment pending)
- **🔴 Red**: Booked seats (confirmed)
- **🔵 Blue**: Selected seat (ready to book)
- **🟣 Purple**: VIP seats
- **🟡 Gold**: Premium seats

### **User Tier Badges**
- **Gray**: Regular tier users
- **Yellow**: Premium tier users  
- **Purple**: VIP tier users

---

## 🔧 Technical Architecture

### **Frontend Stack**
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **HTTP**: Axios
- **Notifications**: React Hot Toast

### **API Integration**
```typescript
// Real-time seat updates
GET /events/{id}/seats

// Booking workflow
POST /bookings          // Reserve seat
PATCH /bookings/{id}/confirm  // Process payment
PATCH /bookings/{id}/cancel   // Cancel reservation
```

### **WebSocket Events** (Future Enhancement)
```typescript
// Real-time updates
seat.reserved
seat.confirmed
seat.cancelled
seat.expired
```

---

## 🎪 Demo Presentation Flow

### **Opening (2 min)**
1. Show dashboard overview
2. Explain the scenario: "Concert ticket booking system"
3. Point out user tiers and events

### **Core Demos (10 min)**
1. Concurrent booking (3 min)
2. Timeout mechanism (2 min)
3. User tier benefits (2 min)
4. Real-time monitoring (2 min)
5. Service resilience (1 min)

### **Technical Deep Dive (3 min)**
1. Show browser network tab
2. Explain API calls
3. Point out microservice endpoints
4. Mention Kafka in background

### **Conclusion (2 min)**
1. Recap benefits demonstrated
2. Show activity log as audit trail
3. Mention production considerations

---

## 🛠️ Troubleshooting

### **Common Issues**

1. **Port Already in Use**
   ```bash
   npm run dev -- -p 3002
   ```

2. **API Connection Failed**
   ```bash
   # Check backend services
   docker-compose ps
   curl http://localhost:3000/events
   ```

3. **Build Errors**
   ```bash
   npm install
   rm -rf .next
   npm run dev
   ```

4. **TypeScript Errors**
   ```bash
   npm run build
   # Fix reported issues
   ```

### **Performance Tips**
- Use Chrome Dev Tools Network tab
- Monitor React Developer Tools
- Check browser console for errors
- Use React Profiler for performance

---

## 🎯 Customization for Your Seminar

### **Branding**
- Edit `src/pages/index.tsx` header section
- Modify colors in `tailwind.config.js`
- Update title in `src/pages/_app.tsx`

### **Demo Data**
- Add events in `apps/event-service/src/seeds/`
- Modify users in `apps/auth-service/src/seeds/`
- Adjust timeout values in `BookingPanel.tsx`

### **Additional Features**
- Add WebSocket for real-time updates
- Implement seat recommendations
- Add booking history view
- Create admin dashboard

---

## 📚 Further Learning

- **Next.js Documentation**: https://nextjs.org/docs
- **React Patterns**: https://reactpatterns.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

*Built for demonstrating microservices architecture and Kafka benefits in real-world scenarios* 🎤 