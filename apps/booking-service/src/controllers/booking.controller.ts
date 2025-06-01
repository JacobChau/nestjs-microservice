import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { BookingService } from '../services/booking.service';
import { KafkaTopics, CreateBookingDto } from '@app/common';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern(KafkaTopics.BOOKING_CREATE)
  async createBooking(@Payload() data: { createBookingDto: CreateBookingDto; userId: string }) {
    try {
      return await this.bookingService.createBooking(data.createBookingDto, data.userId);
    } catch (error) {
      console.log('🔴 Booking Controller - Throwing RpcException:', error.message);
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(KafkaTopics.BOOKING_FIND_ALL)
  async findUserBookings(@Payload() data: { userId: string }) {
    try {
      return await this.bookingService.findUserBookings(data.userId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(KafkaTopics.BOOKING_CANCEL)
  async cancelBooking(@Payload() data: { bookingId: string }) {
    try {
      return await this.bookingService.cancelBooking(data.bookingId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(KafkaTopics.BOOKING_CONFIRM)
  async confirmBooking(@Payload() data: { bookingId: string }) {
    try {
      return await this.bookingService.confirmBooking(data.bookingId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern('SEAT_AVAILABILITY_GET')
  async getSeatAvailability(@Payload() data: { eventId: string }) {
    try {
      return await this.bookingService.getSeatAvailability(data.eventId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern('SEAT_STATUS_REALTIME')
  async getRealtimeSeatStatus(@Payload() data: { eventId: string }) {
    try {
      return await this.bookingService.getRealtimeSeatStatus(data.eventId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern('BOOKING_EXTEND_TIME')
  async extendBookingTime(@Payload() data: { bookingId: string; additionalSeconds?: number }) {
    try {
      return await this.bookingService.extendBookingTime(data.bookingId, data.additionalSeconds);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
} 