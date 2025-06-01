import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Seat, SeatDocument } from '../schemas/seat.schema';
import { Event, EventDocument } from '../schemas/event.schema';
import { KafkaTopics } from '@app/common';

@Injectable()
export class SeatService {
  constructor(
    @InjectModel(Seat.name) private seatModel: Model<SeatDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async getAvailableSeats(eventId: string): Promise<Seat[]> {
    // Release expired reservations first
    await this.releaseExpiredReservations();
    
    return this.seatModel.find({ 
      eventId, 
      status: 'available' 
    }).exec();
  }

  async reserveSeats(eventId: string, seatIds: string[], userId: string): Promise<Seat[]> {
    // Release expired reservations first
    await this.releaseExpiredReservations();

    // Check if seats are available
    const seats = await this.seatModel.find({
      id: { $in: seatIds },
      eventId,
      status: 'available'
    }).exec();

    if (seats.length !== seatIds.length) {
      throw new Error('Some seats are not available');
    }

    // Reserve seats for 10 minutes
    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000);
    
    const updatedSeats = await this.seatModel.find({
      id: { $in: seatIds }
    }).exec();

    await this.seatModel.updateMany(
      { id: { $in: seatIds } },
      { 
        status: 'reserved',
        reservedUntil,
        reservedBy: userId
      }
    ).exec();

    // Update event available seats count
    await this.eventModel.updateOne(
      { id: eventId },
      { $inc: { availableSeats: -seatIds.length } }
    ).exec();

    // Publish seat reserved event
    this.kafkaClient.emit(KafkaTopics.SEAT_RESERVED, {
      eventId,
      seatIds,
      userId,
      timestamp: new Date(),
    });

    return updatedSeats.map(seat => ({
      ...seat.toObject(),
      status: 'reserved',
      reservedUntil,
      reservedBy: userId
    }));
  }

  async confirmSeats(seatIds: string[]): Promise<void> {
    await this.seatModel.updateMany(
      { id: { $in: seatIds } },
      { 
        status: 'booked',
        $unset: { reservedUntil: 1, reservedBy: 1 }
      }
    ).exec();
  }

  async releaseSeats(seatIds: string[], eventId: string): Promise<void> {
    await this.seatModel.updateMany(
      { id: { $in: seatIds } },
      { 
        status: 'available',
        $unset: { reservedUntil: 1, reservedBy: 1 }
      }
    ).exec();

    // Update event available seats count
    await this.eventModel.updateOne(
      { id: eventId },
      { $inc: { availableSeats: seatIds.length } }
    ).exec();

    // Publish seat released event
    this.kafkaClient.emit(KafkaTopics.SEAT_RELEASED, {
      eventId,
      seatIds,
      timestamp: new Date(),
    });
  }

  async getSeatsByIds(seatIds: string[]): Promise<Seat[]> {
    return this.seatModel.find({ id: { $in: seatIds } }).exec();
  }

  private async releaseExpiredReservations(): Promise<void> {
    const expiredSeats = await this.seatModel.find({
      status: 'reserved',
      reservedUntil: { $lt: new Date() }
    }).exec();

    if (expiredSeats.length > 0) {
      const seatIds = expiredSeats.map(seat => seat.id);
      const eventIds = [...new Set(expiredSeats.map(seat => seat.eventId))];

      // Release expired seats
      await this.seatModel.updateMany(
        { id: { $in: seatIds } },
        { 
          status: 'available',
          $unset: { reservedUntil: 1, reservedBy: 1 }
        }
      ).exec();

      // Update event available seats counts
      for (const eventId of eventIds) {
        const expiredSeatsForEvent = expiredSeats.filter(seat => seat.eventId === eventId);
        await this.eventModel.updateOne(
          { id: eventId },
          { $inc: { availableSeats: expiredSeatsForEvent.length } }
        ).exec();
      }

      console.log(`Released ${seatIds.length} expired seat reservations`);
    }
  }
} 