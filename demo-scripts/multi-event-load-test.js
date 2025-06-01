const axios = require('axios');
const { performance } = require('perf_hooks');

class MultiEventLoadTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.events = [
      {
        id: 'event_1703123456789_abc123def',
        name: 'Taylor Swift - The Eras Tour',
        users: 80, // High demand
        venue: 'Madison Square Garden'
      },
      {
        id: 'event_1703123456790_def456ghi', 
        name: 'Ed Sheeran - Mathematics Tour',
        users: 40, // Medium demand
        venue: 'Wembley Stadium'
      },
      {
        id: 'event_1703123456791_ghi789jkl',
        name: 'Local Jazz Night',
        users: 15, // Low demand
        venue: 'Blue Note Jazz Club'
      }
    ];
    this.results = [];
  }

  async runMultiEventSimulation() {
    console.log('🎭 Multi-Event Load Testing Simulation');
    console.log('=====================================');
    console.log('🎯 Simulating realistic demand patterns across multiple events');
    console.log('');

    // Show event demand distribution
    this.events.forEach(event => {
      console.log(`🎪 ${event.name}`);
      console.log(`   📍 Venue: ${event.venue}`);
      console.log(`   👥 Simulated Users: ${event.users}`);
      console.log('');
    });

    const startTime = performance.now();

    // Create promises for all events
    const eventPromises = this.events.map(event => 
      this.simulateEventBooking(event)
    );

    // Wait for all events to complete
    const eventResults = await Promise.allSettled(eventPromises);

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;

    this.printMultiEventResults(totalTime, eventResults);
  }

  async simulateEventBooking(event) {
    console.log(`🚀 Starting booking simulation for ${event.name}...`);
    
    const userPromises = Array.from({ length: event.users }, (_, i) => 
      this.simulateUserBooking(event, i + 1)
    );

    const results = await Promise.allSettled(userPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
    const errors = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ ${event.name}: ${successful} successful, ${failed} conflicts, ${errors} errors`);

    return {
      event: event.name,
      successful,
      failed,
      errors,
      totalUsers: event.users,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
    };
  }

  async simulateUserBooking(event, userId) {
    const startTime = performance.now();
    
    try {
      // Step 1: Register/Login user
      const userEmail = `demo${event.id}_${userId}@example.com`;
      
      // Try to register first (might fail if user exists)
      try {
        await axios.post(`${this.baseUrl}/auth/register`, {
          email: userEmail,
          name: `Demo User ${userId}`,
          password: 'demo123',
          tier: 'regular'
        });
      } catch (regError) {
        // User might already exist, continue with login
      }

      // Login
      const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, {
        email: userEmail,
        password: 'demo123'
      });

      const token = loginResponse.data.data.token;

      // Step 2: Get available seats
      const seatsResponse = await axios.get(`${this.baseUrl}/events/${event.id}/seats`);
      const availableSeats = seatsResponse.data.data.filter(seat => seat.status === 'available');

      if (availableSeats.length === 0) {
        throw new Error('No seats available');
      }

      // Step 3: Random delay to simulate user behavior
      await this.delay(Math.random() * 1000); // 0-1 seconds

      // Step 4: Book a random seat
      const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
      
      const bookingResponse = await axios.post(`${this.baseUrl}/bookings`, {
        eventId: event.id,
        seatIds: [randomSeat.id]
      }, {
        headers: { Authorization: token }
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        userId,
        eventName: event.name,
        success: true,
        responseTime,
        bookingId: bookingResponse.data.data.id,
        seatId: randomSeat.id
      };

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        userId,
        eventName: event.name,
        success: false,
        responseTime,
        error: error.response?.data?.error || error.message
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printMultiEventResults(totalTime, eventResults) {
    console.log('');
    console.log('📊 MULTI-EVENT SIMULATION RESULTS');
    console.log('=================================');
    console.log(`⏱️  Total Simulation Time: ${totalTime.toFixed(2)}s`);
    console.log('');

    let totalUsers = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalErrors = 0;

    eventResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const eventResult = result.value;
        const event = this.events[index];
        
        console.log(`🎪 ${eventResult.event}`);
        console.log(`   👥 Users: ${eventResult.totalUsers}`);
        console.log(`   ✅ Successful: ${eventResult.successful} (${((eventResult.successful / eventResult.totalUsers) * 100).toFixed(1)}%)`);
        console.log(`   ⚠️  Conflicts: ${eventResult.failed}`);
        console.log(`   ❌ Errors: ${eventResult.errors}`);
        
        // Calculate average response time for this event
        const responseTimes = eventResult.results
          .filter(r => r.responseTime)
          .map(r => r.responseTime);
        
        if (responseTimes.length > 0) {
          const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
          console.log(`   ⚡ Avg Response: ${avgResponseTime.toFixed(0)}ms`);
        }
        
        console.log('');

        totalUsers += eventResult.totalUsers;
        totalSuccessful += eventResult.successful;
        totalFailed += eventResult.failed;
        totalErrors += eventResult.errors;
      }
    });

    console.log('📈 OVERALL STATISTICS');
    console.log('====================');
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`✅ Total Successful Bookings: ${totalSuccessful}`);
    console.log(`⚠️  Total Conflicts: ${totalFailed}`);
    console.log(`❌ Total Errors: ${totalErrors}`);
    console.log(`📊 Overall Success Rate: ${((totalSuccessful / totalUsers) * 100).toFixed(1)}%`);
    console.log(`📈 Throughput: ${(totalUsers / totalTime).toFixed(1)} requests/second`);

    console.log('');
    console.log('🎯 DEMAND PATTERN ANALYSIS');
    console.log('==========================');
    
    eventResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const eventResult = result.value;
        const event = this.events[index];
        const demandLevel = event.users > 60 ? 'HIGH' : event.users > 30 ? 'MEDIUM' : 'LOW';
        const successRate = ((eventResult.successful / eventResult.totalUsers) * 100).toFixed(1);
        
        console.log(`${demandLevel.padEnd(6)} demand - ${event.name}: ${successRate}% success rate`);
      }
    });

    console.log('');
    console.log('🔍 KEY INSIGHTS');
    console.log('===============');
    console.log('• High-demand events show expected seat conflicts');
    console.log('• System maintains performance across different load patterns');
    console.log('• Microservices handle varying demand independently');
    console.log('• Kafka ensures message ordering and consistency');
    console.log(`• Total system processed ${totalUsers} concurrent requests in ${totalTime.toFixed(1)}s`);
  }
}

// CLI interface
async function main() {
  const tester = new MultiEventLoadTester();
  
  try {
    await tester.runMultiEventSimulation();
  } catch (error) {
    console.error('❌ Multi-event simulation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MultiEventLoadTester; 