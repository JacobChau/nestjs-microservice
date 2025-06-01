import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface SeatReservation {
  seatId: string;
  userId: string;
  bookingId: string;
  expiresAt: number; // Unix timestamp
  eventId: string;
}

@Injectable()
export class RedisSeatService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly RESERVATION_TTL = 30 * 60; // 30 minutes in seconds (demo: 30 seconds)
  private readonly DEMO_TTL = 30; // 30 seconds for demo

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    console.log('🔴 Redis Seat Service connected');
    
    // Start cleanup job for expired reservations
    this.startCleanupJob();
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Atomically reserve seats for a user
   * Returns true if all seats were successfully reserved, false if any conflicts
   */
  async reserveSeats(eventId: string, seatIds: string[], userId: string, bookingId: string): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    const reservationKeys = seatIds.map(seatId => `seat:${eventId}:${seatId}`);
    const expiresAt = Date.now() + (this.DEMO_TTL * 1000); // Demo: 30 seconds
    
    console.log(`🔴 Attempting to reserve seats: ${seatIds.join(', ')} for user ${userId}`);

    // First, check if any seats are already reserved
    const existingReservations = await this.redis.mget(...reservationKeys);
    
    for (let i = 0; i < existingReservations.length; i++) {
      if (existingReservations[i] !== null) {
        const existing = JSON.parse(existingReservations[i]);
        // Check if reservation is still valid (not expired)
        if (existing.expiresAt > Date.now()) {
          console.log(`❌ Seat ${seatIds[i]} already reserved by user ${existing.userId}`);
          return false;
        }
      }
    }

    // All seats are available, reserve them atomically
    const reservation: SeatReservation = {
      seatId: '', // Will be set for each seat
      userId,
      bookingId,
      expiresAt,
      eventId
    };

    for (const seatId of seatIds) {
      const seatReservation = { ...reservation, seatId };
      pipeline.setex(
        `seat:${eventId}:${seatId}`,
        this.DEMO_TTL,
        JSON.stringify(seatReservation)
      );
    }

    // Execute all reservations atomically
    const results = await pipeline.exec();
    
    // Check if all operations succeeded
    const allSucceeded = results.every(([err, result]) => err === null && result === 'OK');
    
    if (allSucceeded) {
      console.log(`✅ Successfully reserved ${seatIds.length} seats for user ${userId}`);
      
      // Cache the seat availability for the event
      await this.updateEventSeatCache(eventId);
      
      return true;
    } else {
      console.log(`❌ Failed to reserve seats for user ${userId}`);
      return false;
    }
  }

  /**
   * Release seat reservations (on cancellation or confirmation)
   */
  async releaseSeats(eventId: string, seatIds: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const seatId of seatIds) {
      pipeline.del(`seat:${eventId}:${seatId}`);
    }
    
    await pipeline.exec();
    
    // Update cached seat availability
    await this.updateEventSeatCache(eventId);
    
    console.log(`🔴 Released ${seatIds.length} seat reservations for event ${eventId}`);
  }

  /**
   * Get current seat availability for an event (with caching)
   */
  async getSeatAvailability(eventId: string): Promise<{
    available: string[];
    reserved: string[];
    booked: string[];
  }> {
    // Try to get from cache first
    const cacheKey = `event:${eventId}:seats`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      console.log(`🔴 Returning cached seat availability for event ${eventId}`);
      return JSON.parse(cached);
    }

    // If not cached, compute and cache
    return await this.updateEventSeatCache(eventId);
  }

  /**
   * Update the cached seat availability for an event
   * Now generates seats dynamically based on event ID
   */
  private async updateEventSeatCache(eventId: string): Promise<{
    available: string[];
    reserved: string[];
    booked: string[];
  }> {
    // Validate eventId
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.log(`🔴 Invalid eventId provided to Redis cache: ${eventId}`);
      return {
        available: [],
        reserved: [],
        booked: []
      };
    }

    // Get all seat reservations for this event
    const pattern = `seat:${eventId}:*`;
    const keys = await this.redis.keys(pattern);
    
    const reservedSeats: string[] = [];
    
    if (keys.length > 0) {
      const reservations = await this.redis.mget(...keys);
      
      for (let i = 0; i < reservations.length; i++) {
        if (reservations[i]) {
          const reservation: SeatReservation = JSON.parse(reservations[i]);
          // Only include if not expired
          if (reservation.expiresAt > Date.now()) {
            reservedSeats.push(reservation.seatId);
          }
        }
      }
    }

    // Generate seat list dynamically based on event ID
    const allSeats: string[] = [];
    // Generate 100 seats: 10 rows (A-J) with 10 seats each
    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      const row = String.fromCharCode(65 + rowIndex); // A, B, C, ..., J
      for (let num = 1; num <= 10; num++) {
        allSeats.push(`${eventId}_${row}${num}`);
      }
    }

    // TODO: Get booked seats from booking service (confirmed bookings)
    // For now, assume no permanently booked seats in demo
    const bookedSeats: string[] = [];
    
    const availableSeats = allSeats.filter(seat => 
      !reservedSeats.includes(seat) && !bookedSeats.includes(seat)
    );

    const result = {
      available: availableSeats,
      reserved: reservedSeats,
      booked: bookedSeats
    };

    // Cache for 10 seconds (frequent updates due to reservations)
    await this.redis.setex(`event:${eventId}:seats`, 10, JSON.stringify(result));
    
    console.log(`🔴 Updated seat cache for event ${eventId}: ${availableSeats.length} available, ${reservedSeats.length} reserved`);
    
    return result;
  }

  /**
   * Get reservation details for a seat
   */
  async getSeatReservation(eventId: string, seatId: string): Promise<SeatReservation | null> {
    const reservation = await this.redis.get(`seat:${eventId}:${seatId}`);
    
    if (!reservation) {
      return null;
    }

    const parsed: SeatReservation = JSON.parse(reservation);
    
    // Check if expired
    if (parsed.expiresAt <= Date.now()) {
      await this.redis.del(`seat:${eventId}:${seatId}`);
      return null;
    }

    return parsed;
  }

  /**
   * Extend reservation time (when user is actively booking)
   */
  async extendReservation(eventId: string, seatId: string, additionalSeconds: number = 30): Promise<boolean> {
    const reservation = await this.getSeatReservation(eventId, seatId);
    
    if (!reservation) {
      return false;
    }

    reservation.expiresAt = Date.now() + (additionalSeconds * 1000);
    
    await this.redis.setex(
      `seat:${eventId}:${seatId}`,
      additionalSeconds,
      JSON.stringify(reservation)
    );

    console.log(`🔴 Extended reservation for seat ${seatId} by ${additionalSeconds} seconds`);
    return true;
  }

  /**
   * Cleanup job to remove expired reservations and update caches
   */
  private startCleanupJob(): void {
    setInterval(async () => {
      try {
        // Get all seat reservation keys
        const keys = await this.redis.keys('seat:*');
        
        if (keys.length === 0) return;

        const reservations = await this.redis.mget(...keys);
        const expiredKeys: string[] = [];
        const eventsToUpdate = new Set<string>();

        for (let i = 0; i < reservations.length; i++) {
          if (reservations[i]) {
            const reservation: SeatReservation = JSON.parse(reservations[i]);
            if (reservation.expiresAt <= Date.now()) {
              expiredKeys.push(keys[i]);
              eventsToUpdate.add(reservation.eventId);
            }
          }
        }

        if (expiredKeys.length > 0) {
          // Remove expired reservations
          await this.redis.del(...expiredKeys);
          
          // Update caches for affected events
          for (const eventId of eventsToUpdate) {
            await this.updateEventSeatCache(eventId);
          }

          console.log(`🔴 Cleanup: Removed ${expiredKeys.length} expired seat reservations`);
        }
      } catch (error) {
        console.error('🔴 Error in cleanup job:', error);
      }
    }, 5000); // Run every 5 seconds for demo (in production: every minute)
  }
} 