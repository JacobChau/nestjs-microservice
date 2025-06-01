import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BookingEntity } from '../entities/booking.entity';
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
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string): Promise<Booking> {
    // Generate unique booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get seat information from event service
      const seats = await firstValueFrom(
        this.eventClient.send(KafkaTopics.SEAT_FIND_AVAILABLE, {
          eventId: createBookingDto.eventId
        })
      );

      // Filter requested seats and calculate total amount
      const requestedSeats = seats.filter(seat => 
        createBookingDto.seatIds.includes(seat.id)
      );

      if (requestedSeats.length !== createBookingDto.seatIds.length) {
        throw new Error('Some seats are not available');
      }

      const totalAmount = requestedSeats.reduce((sum, seat) => sum + seat.price, 0);

      // Reserve seats
      await firstValueFrom(
        this.eventClient.send(KafkaTopics.SEAT_RESERVE, {
          eventId: createBookingDto.eventId,
          seatIds: createBookingDto.seatIds,
          userId
        })
      );

      // Create booking record
      const booking = this.bookingRepository.create({
        id: bookingId,
        userId,
        eventId: createBookingDto.eventId,
        seatIds: createBookingDto.seatIds,
        totalAmount,
        status: 'pending',
      });

      const savedBooking = await this.bookingRepository.save(booking);

      // Publish booking requested event
      this.kafkaClient.emit(KafkaTopics.BOOKING_REQUESTED, {
        bookingId: booking.id,
        userId,
        eventId: createBookingDto.eventId,
        seatIds: createBookingDto.seatIds,
        totalAmount: booking.totalAmount,
        timestamp: new Date(),
      });

      return this.mapToBooking(savedBooking);
    } catch (error) {
      // Release seats if booking creation fails
      try {
        await firstValueFrom(
          this.eventClient.send(KafkaTopics.SEAT_RELEASE, {
            seatIds: createBookingDto.seatIds,
            eventId: createBookingDto.eventId
          })
        );
      } catch (releaseError) {
        console.error('Failed to release seats:', releaseError);
      }

      throw error;
    }
  }

  async getBookings(userId: string): Promise<Booking[]> {
    const bookings = await this.bookingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return bookings.map(booking => this.mapToBooking(booking));
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId }
    });

    return booking ? this.mapToBooking(booking) : null;
  }

  async confirmBooking(bookingId: string, paymentId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error('Booking cannot be confirmed');
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentId = paymentId;
    const updatedBooking = await this.bookingRepository.save(booking);

    // Confirm seats in event service
    await firstValueFrom(
      this.eventClient.send('confirm_seats', {
        seatIds: booking.seatIds
      })
    );

    // Publish booking confirmed event
    this.kafkaClient.emit(KafkaTopics.BOOKING_CONFIRMED, {
      bookingId,
      paymentId,
      confirmedAt: new Date(),
    });

    return this.mapToBooking(updatedBooking);
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'confirmed') {
      throw new Error('Cannot cancel confirmed booking');
    }

    // Update booking status
    booking.status = 'cancelled';
    const updatedBooking = await this.bookingRepository.save(booking);

    // Release seats
    await firstValueFrom(
      this.eventClient.send(KafkaTopics.SEAT_RELEASE, {
        seatIds: booking.seatIds,
        eventId: booking.eventId
      })
    );

    // Publish booking cancelled event
    this.kafkaClient.emit(KafkaTopics.BOOKING_CANCELLED, {
      bookingId,
      cancelledAt: new Date(),
    });

    return this.mapToBooking(updatedBooking);
  }

  private mapToBooking(entity: BookingEntity): Booking {
    return {
      id: entity.id,
      userId: entity.userId,
      eventId: entity.eventId,
      seatIds: entity.seatIds,
      totalAmount: parseFloat(entity.totalAmount.toString()),
      status: entity.status as 'pending' | 'confirmed' | 'cancelled' | 'refunded',
      paymentId: entity.paymentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
} 