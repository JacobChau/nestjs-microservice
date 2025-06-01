import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookingService } from '../services/booking.service';
import { KafkaTopics, CreateBookingDto } from '@app/common';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern(KafkaTopics.BOOKING_CREATE)
  async createBooking(@Payload() data: { createBookingDto: CreateBookingDto; userId: string }) {
    return this.bookingService.createBooking(data.createBookingDto, data.userId);
  }

  @MessagePattern(KafkaTopics.BOOKING_FIND_ALL)
  async getBookings(@Payload() data: { userId: string }) {
    return this.bookingService.getBookings(data.userId);
  }

  @MessagePattern(KafkaTopics.BOOKING_FIND_ONE)
  async getBooking(@Payload() data: { bookingId: string }) {
    return this.bookingService.getBooking(data.bookingId);
  }

  @MessagePattern(KafkaTopics.BOOKING_CANCEL)
  async cancelBooking(@Payload() data: { bookingId: string }) {
    return this.bookingService.cancelBooking(data.bookingId);
  }

  @MessagePattern(KafkaTopics.BOOKING_CONFIRM)
  async confirmBooking(@Payload() data: { bookingId: string; paymentId: string }) {
    return this.bookingService.confirmBooking(data.bookingId, data.paymentId);
  }
} 