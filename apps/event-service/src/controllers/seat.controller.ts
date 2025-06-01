import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SeatService } from '../services/seat.service';
import { KafkaTopics } from '@app/common';

@Controller()
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @MessagePattern(KafkaTopics.SEAT_FIND_AVAILABLE)
  async findAvailableSeats(@Payload() data: { eventId: string }) {
    return this.seatService.getAvailableSeats(data.eventId);
  }

  @MessagePattern(KafkaTopics.SEAT_RESERVE)
  async reserveSeats(@Payload() data: { eventId: string; seatIds: string[]; userId: string }) {
    return this.seatService.reserveSeats(data.eventId, data.seatIds, data.userId);
  }

  @MessagePattern(KafkaTopics.SEAT_RELEASE)
  async releaseSeats(@Payload() data: { seatIds: string[]; eventId: string }) {
    return this.seatService.releaseSeats(data.seatIds, data.eventId);
  }
} 