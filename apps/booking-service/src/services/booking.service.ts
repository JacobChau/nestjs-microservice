import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { BookingEntity } from '../entities/booking.entity';
import { RedisSeatService } from './redis-seat.service';
import { 
  CreateBookingDto, 
  Booking, 
  KafkaTopics 
} from '@app/common';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @Inject('EVENT_SERVICE') private eventClient: ClientKafka,
    @Inject('AUTH_SERVICE') private authClient: ClientKafka,
    private readonly redisSeatService: RedisSeatService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string): Promise<Booking> {
    console.log('📝 Creating booking with data:', createBookingDto, 'for user:', userId);
    
    try {
      // Generate booking ID first
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Step 1: Try to atomically reserve seats in Redis
      console.log('🔴 Attempting atomic seat reservation in Redis...');
      const reservationSuccess = await this.redisSeatService.reserveSeats(
        createBookingDto.eventId,
        createBookingDto.seatIds,
        userId,
        bookingId
      );

      if (!reservationSuccess) {
        // Get detailed information about which seats are taken
        const seatAvailability = await this.redisSeatService.getSeatAvailability(createBookingDto.eventId);
        const conflictingSeats = createBookingDto.seatIds.filter(seatId => 
          seatAvailability.reserved.includes(seatId)
        );
        
        // Create user-friendly error message
        if (conflictingSeats.length > 0) {
          const seatNames = conflictingSeats.map(seatId => {
            const seatCode = seatId.split('_').pop(); // Get "A1" from "event_123_A1"
            return seatCode;
          }).join(', ');
          
          const message = conflictingSeats.length === 1 
            ? `Seat ${seatNames} was just taken by another user. Please choose a different seat.`
            : `Seats ${seatNames} were just taken by other users. Please choose different seats.`;
          
          console.log('❌ Redis reservation failed:', message);
          throw new Error(message);
        } else {
          const message = 'The selected seat(s) are no longer available. Please refresh and choose different seats.';
          console.log('❌ Redis reservation failed:', message);
          throw new Error(message);
        }
      }

      // Step 2: Create booking record in database
      console.log('✅ Redis reservation successful. Creating booking record...');
      const booking = this.bookingRepository.create({
        id: bookingId,
        userId,
        eventId: createBookingDto.eventId,
        seatIds: createBookingDto.seatIds,
        status: 'pending',
        totalAmount: createBookingDto.seatIds.length * 50, // $50 per seat for demo
        expiresAt: new Date(Date.now() + 30 * 1000), // 30 seconds for demo
      });
      
      const savedBooking = await this.bookingRepository.save(booking);
      console.log('✅ Booking created successfully:', savedBooking.id);

      // Step 3: Emit booking created event for real-time updates
      this.eventClient.emit('booking.created', {
        bookingId: savedBooking.id,
        userId: savedBooking.userId,
        eventId: savedBooking.eventId,
        seatIds: savedBooking.seatIds,
        totalAmount: savedBooking.totalAmount,
        status: savedBooking.status,
        createdAt: savedBooking.createdAt,
        expiresAt: savedBooking.expiresAt
      });

      // Step 4: Start timeout job for this booking
      this.scheduleBookingTimeout(savedBooking.id, 30 * 1000); // 30 seconds for demo

      return {
        id: savedBooking.id,
        userId: savedBooking.userId,
        eventId: savedBooking.eventId,
        seatIds: savedBooking.seatIds,
        totalAmount: savedBooking.totalAmount,
        status: savedBooking.status as any,
        createdAt: savedBooking.createdAt,
        updatedAt: savedBooking.updatedAt,
        expiresAt: savedBooking.expiresAt,
      };

    } catch (error) {
      console.error('❌ Error creating booking:', error.message);
      
      // If we have a booking ID, make sure to clean up Redis reservations
      if (error.message.includes('booking_')) {
        const bookingIdMatch = error.message.match(/booking_\w+/);
        if (bookingIdMatch) {
          await this.redisSeatService.releaseSeats(createBookingDto.eventId, createBookingDto.seatIds);
        }
      }
      
      throw error;
    }
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    console.log('💳 Confirming booking:', bookingId);
    
    const booking = await this.bookingRepository.findOne({ 
      where: { id: bookingId } 
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot confirm booking with status: ${booking.status}`);
    }

    // Check if booking has expired
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new Error('⏰ Booking has expired. Please create a new booking.');
    }

    // Step 1: Update booking status to confirmed
    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    
    const updatedBooking = await this.bookingRepository.save(booking);
    console.log('✅ Booking confirmed successfully - seats are now permanently booked');

    // Step 2: Release Redis reservations (seats are now permanently booked)
    await this.redisSeatService.releaseSeats(booking.eventId, booking.seatIds);

    // Step 3: Emit booking confirmed event for real-time updates
    this.eventClient.emit('booking.confirmed', {
      bookingId: updatedBooking.id,
      userId: updatedBooking.userId,
      eventId: updatedBooking.eventId,
      seatIds: updatedBooking.seatIds,
      totalAmount: updatedBooking.totalAmount,
      status: updatedBooking.status,
      updatedAt: updatedBooking.updatedAt
    });

    return {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      eventId: updatedBooking.eventId,
      seatIds: updatedBooking.seatIds,
      totalAmount: updatedBooking.totalAmount,
      status: updatedBooking.status as any,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    console.log('🚫 Cancelling booking:', bookingId);
    
    const booking = await this.bookingRepository.findOne({ 
      where: { id: bookingId } 
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'confirmed') {
      throw new Error('Cannot cancel confirmed booking');
    }

    // Step 1: Update booking status to cancelled
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    
    const updatedBooking = await this.bookingRepository.save(booking);
    console.log('✅ Booking cancelled successfully - seats are now available again');

    // Step 2: Release Redis reservations
    await this.redisSeatService.releaseSeats(booking.eventId, booking.seatIds);

    // Step 3: Emit booking cancelled event for real-time updates
    this.eventClient.emit('booking.cancelled', {
      bookingId: updatedBooking.id,
      userId: updatedBooking.userId,
      eventId: updatedBooking.eventId,
      seatIds: updatedBooking.seatIds,
      totalAmount: updatedBooking.totalAmount,
      status: updatedBooking.status,
      updatedAt: updatedBooking.updatedAt
    });

    return {
      id: updatedBooking.id,
      userId: updatedBooking.userId,
      eventId: updatedBooking.eventId,
      seatIds: updatedBooking.seatIds,
      totalAmount: updatedBooking.totalAmount,
      status: updatedBooking.status as any,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };
  }

  async findUserBookings(userId: string): Promise<Booking[]> {
    console.log('🔍 Finding bookings for user:', userId);
    
    const bookings = await this.bookingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return bookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      seatIds: booking.seatIds,
      totalAmount: booking.totalAmount,
      status: booking.status as any,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));
  }

  // Enhanced seat availability using Redis cache
  async getSeatAvailability(eventId: string): Promise<{available: string[], reserved: string[], booked: string[]}> {
    console.log('🔍 Checking seat availability for event:', eventId);
    
    // Validate eventId
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.log(`❌ Invalid eventId provided: ${eventId}`);
      return {
        available: [],
        reserved: [],
        booked: []
      };
    }
    
    // Get cached availability from Redis
    const redisAvailability = await this.redisSeatService.getSeatAvailability(eventId);
    
    // Get confirmed bookings from database
    const confirmedBookings = await this.bookingRepository.find({
      where: { eventId, status: 'confirmed' }
    });

    // Use Set to ensure unique seat IDs (prevent duplicates)
    const bookedSeatsSet = new Set<string>();
    confirmedBookings.forEach(booking => {
      booking.seatIds.forEach(seatId => {
        bookedSeatsSet.add(seatId);
      });
    });
    const bookedSeats = Array.from(bookedSeatsSet);
    
    // Generate seat list dynamically based on event ID
    const allSeats = [];
    // Generate 100 seats: 10 rows (A-J) with 10 seats each
    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      const row = String.fromCharCode(65 + rowIndex); // A, B, C, ..., J
      for (let num = 1; num <= 10; num++) {
        allSeats.push(`${eventId}_${row}${num}`);
      }
    }

    const availableSeats = allSeats.filter(seat => 
      !redisAvailability.reserved.includes(seat) && !bookedSeats.includes(seat)
    );

    return {
      available: availableSeats,
      reserved: redisAvailability.reserved,
      booked: bookedSeats
    };
  }

  /**
   * Schedule automatic booking timeout
   */
  private scheduleBookingTimeout(bookingId: string, timeoutMs: number): void {
    setTimeout(async () => {
      try {
        const booking = await this.bookingRepository.findOne({ 
          where: { id: bookingId } 
        });
        
        if (booking && booking.status === 'pending') {
          console.log(`⏰ Booking ${bookingId} has timed out. Auto-cancelling...`);
          
          // Auto-cancel the booking
          booking.status = 'cancelled';
          booking.updatedAt = new Date();
          await this.bookingRepository.save(booking);
          
          // Release Redis reservations
          await this.redisSeatService.releaseSeats(booking.eventId, booking.seatIds);
          
          // Emit timeout event
          this.eventClient.emit('booking.expired', {
            bookingId: booking.id,
            userId: booking.userId,
            eventId: booking.eventId,
            seatIds: booking.seatIds,
            reason: 'timeout'
          });
          
          console.log(`✅ Booking ${bookingId} auto-cancelled due to timeout`);
        }
      } catch (error) {
        console.error(`❌ Error handling booking timeout for ${bookingId}:`, error);
      }
    }, timeoutMs);
  }

  /**
   * Extend booking reservation time (when user is actively in payment process)
   */
  async extendBookingTime(bookingId: string, additionalSeconds: number = 30): Promise<boolean> {
    const booking = await this.bookingRepository.findOne({ 
      where: { id: bookingId } 
    });
    
    if (!booking || booking.status !== 'pending') {
      return false;
    }

    // Extend Redis reservations
    for (const seatId of booking.seatIds) {
      await this.redisSeatService.extendReservation(booking.eventId, seatId, additionalSeconds);
    }

    // Update booking expiration
    booking.expiresAt = new Date(Date.now() + (additionalSeconds * 1000));
    await this.bookingRepository.save(booking);

    console.log(`🔴 Extended booking ${bookingId} by ${additionalSeconds} seconds`);
    return true;
  }

  /**
   * Get real-time seat status for UI
   */
  async getRealtimeSeatStatus(eventId: string): Promise<{
    available: string[];
    reserved: { seatId: string; userId: string; expiresAt: number }[];
    booked: { seatId: string; userId: string }[];
  }> {
    // Validate eventId
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.log(`❌ Invalid eventId provided: ${eventId}`);
      return {
        available: [],
        reserved: [],
        booked: []
      };
    }

    // Get Redis reservations with details
    const reservationKeys = await this.redisSeatService['redis'].keys(`seat:${eventId}:*`);
    const reservedSeats = [];
    
    if (reservationKeys.length > 0) {
      const reservations = await this.redisSeatService['redis'].mget(...reservationKeys);
      
      for (let i = 0; i < reservations.length; i++) {
        if (reservations[i]) {
          const reservation = JSON.parse(reservations[i]);
          if (reservation.expiresAt > Date.now()) {
            reservedSeats.push({
              seatId: reservation.seatId,
              userId: reservation.userId,
              expiresAt: reservation.expiresAt
            });
          }
        }
      }
    }

    // Get confirmed bookings with user information
    const confirmedBookings = await this.bookingRepository.find({
      where: { eventId, status: 'confirmed' }
    });
    
    // Use Set to ensure unique seat IDs and track user information
    const bookedSeatsMap = new Map<string, string>(); // seatId -> userId
    confirmedBookings.forEach(booking => {
      booking.seatIds.forEach(seatId => {
        // If seat is already booked, keep the first booking (shouldn't happen but safety measure)
        if (!bookedSeatsMap.has(seatId)) {
          bookedSeatsMap.set(seatId, booking.userId);
        }
      });
    });
    
    const bookedSeats = Array.from(bookedSeatsMap.entries()).map(([seatId, userId]) => ({
      seatId,
      userId
    }));

    // Calculate available seats
    const allSeats = [];
    // Generate 100 seats: 10 rows (A-J) with 10 seats each
    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      const row = String.fromCharCode(65 + rowIndex); // A, B, C, ..., J
      for (let num = 1; num <= 10; num++) {
        allSeats.push(`${eventId}_${row}${num}`);
      }
    }

    const reservedSeatIds = reservedSeats.map(r => r.seatId);
    const bookedSeatIds = bookedSeats.map(b => b.seatId);
    const availableSeats = allSeats.filter(seat => 
      !reservedSeatIds.includes(seat) && !bookedSeatIds.includes(seat)
    );

    return {
      available: availableSeats,
      reserved: reservedSeats,
      booked: bookedSeats
    };
  }
} 