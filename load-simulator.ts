import axios from 'axios';
import { performance } from 'perf_hooks';

interface BookingResult {
  userId: number;
  success: boolean;
  responseTime: number;
  error?: string;
  bookingId?: string;
}

class TicketBookingLoadSimulator {
  private baseUrl = 'http://localhost:3000';
  private concurrentUsers = 50;
  private results: BookingResult[] = [];

  constructor(concurrentUsers = 50, baseUrl = 'http://localhost:3000') {
    this.concurrentUsers = concurrentUsers;
    this.baseUrl = baseUrl;
  }

  async runSimulation(): Promise<void> {
    console.log('🎭 Ticket Booking Load Simulation');
    console.log('================================');
    console.log(`🚀 Starting simulation with ${this.concurrentUsers} concurrent users`);
    console.log(`🎯 Target: ${this.baseUrl}`);
    console.log(`📅 Event: Jazz Night 2024 (100 seats available)`);
    console.log('');

    const startTime = performance.now();

    // Create promises for all concurrent users
    const userPromises = Array.from({ length: this.concurrentUsers }, (_, i) => 
      this.simulateUser(i + 1)
    );

    // Wait for all users to complete
    await Promise.allSettled(userPromises);

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;

    this.printResults(totalTime);
  }

  private async simulateUser(userId: number): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Step 1: Login
      const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, {
        email: `demo${userId}@example.com`,
        password: 'demo123'
      });

      const token = loginResponse.data.token;

      // Step 2: Random delay to simulate real user behavior
      await this.delay(Math.random() * 2000); // 0-2 seconds

      // Step 3: Attempt to book a random seat
      const seatId = `${this.getRandomRow()}${this.getRandomSeat()}`;
      
      const bookingResponse = await axios.post(`${this.baseUrl}/bookings`, {
        eventId: 'jazz_night_2024',
        seatIds: [seatId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.push({
        userId,
        success: true,
        responseTime,
        bookingId: bookingResponse.data.bookingId
      });

      console.log(`✅ User ${userId.toString().padStart(2, '0')}: Booked seat ${seatId} (${responseTime.toFixed(0)}ms)`);

    } catch (error: any) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const errorMessage = error.response?.data?.message || error.message;
      
      this.results.push({
        userId,
        success: false,
        responseTime,
        error: errorMessage
      });

      if (error.response?.status === 409) {
        console.log(`⚠️  User ${userId.toString().padStart(2, '0')}: Seat taken (${responseTime.toFixed(0)}ms)`);
      } else {
        console.log(`❌ User ${userId.toString().padStart(2, '0')}: ${errorMessage} (${responseTime.toFixed(0)}ms)`);
      }
    }
  }

  private getRandomRow(): string {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return rows[Math.floor(Math.random() * rows.length)];
  }

  private getRandomSeat(): string {
    return (Math.floor(Math.random() * 10) + 1).toString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResults(totalTime: number): void {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const seatTaken = failed.filter(r => r.error?.includes('taken') || r.error?.includes('409'));
    const errors = failed.filter(r => !r.error?.includes('taken') && !r.error?.includes('409'));

    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    const successRate = (successful.length / this.results.length) * 100;

    console.log('');
    console.log('📊 SIMULATION RESULTS');
    console.log('====================');
    console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}s`);
    console.log(`👥 Concurrent Users: ${this.concurrentUsers}`);
    console.log(`📈 Requests/Second: ${(this.results.length / totalTime).toFixed(1)}`);
    console.log('');
    console.log('🎫 BOOKING RESULTS:');
    console.log(`✅ Successful Bookings: ${successful.length}`);
    console.log(`⚠️  Seats Already Taken: ${seatTaken.length}`);
    console.log(`❌ System Errors: ${errors.length}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('');
    console.log('⚡ PERFORMANCE:');
    console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`🚀 Fastest Booking: ${Math.min(...this.results.map(r => r.responseTime)).toFixed(0)}ms`);
    console.log(`🐌 Slowest Booking: ${Math.max(...this.results.map(r => r.responseTime)).toFixed(0)}ms`);

    if (errors.length > 0) {
      console.log('');
      console.log('🔍 ERROR ANALYSIS:');
      const errorTypes = errors.reduce((acc, r) => {
        const error = r.error || 'Unknown';
        acc[error] = (acc[error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(errorTypes).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} occurrences`);
      });
    }

    console.log('');
    console.log('🎯 KEY INSIGHTS:');
    console.log(`   • ${successful.length} users successfully booked tickets`);
    console.log(`   • ${seatTaken.length} users encountered seat conflicts (expected behavior)`);
    console.log(`   • System handled ${this.results.length} concurrent requests in ${totalTime.toFixed(1)}s`);
    console.log(`   • Average booking time: ${avgResponseTime.toFixed(0)}ms`);
    
    if (successRate > 80) {
      console.log('   • ✅ Excellent performance under load!');
    } else if (successRate > 60) {
      console.log('   • ⚠️  Good performance, some optimization possible');
    } else {
      console.log('   • ❌ Performance issues detected, investigation needed');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const concurrentUsers = args[0] ? parseInt(args[0]) : 50;
  const baseUrl = args[1] || 'http://localhost:3000';

  if (isNaN(concurrentUsers) || concurrentUsers <= 0) {
    console.error('❌ Invalid number of concurrent users');
    console.log('Usage: npx ts-node load-simulator.ts [concurrent_users] [base_url]');
    console.log('Example: npx ts-node load-simulator.ts 50 http://localhost:3000');
    process.exit(1);
  }

  const simulator = new TicketBookingLoadSimulator(concurrentUsers, baseUrl);
  
  try {
    await simulator.runSimulation();
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { TicketBookingLoadSimulator }; 