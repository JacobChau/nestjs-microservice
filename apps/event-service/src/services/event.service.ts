import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Event, EventDocument } from '../schemas/event.schema';
import { Seat, SeatDocument } from '../schemas/seat.schema';
import { CreateEventDto, KafkaTopics } from '@app/common';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Seat.name) private seatModel: Model<SeatDocument>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event = new this.eventModel({
      ...createEventDto,
      id: eventId,
      availableSeats: createEventDto.totalSeats,
    });

    const savedEvent = await event.save();

    // Generate seats for the event
    await this.generateSeats(eventId, createEventDto.totalSeats, createEventDto.price);

    // Publish event created message
    this.kafkaClient.emit(KafkaTopics.EVENT_CREATED, {
      eventId,
      name: createEventDto.name,
      venue: createEventDto.venue,
      date: createEventDto.date,
      totalSeats: createEventDto.totalSeats,
      price: createEventDto.price,
    });

    return savedEvent.toObject();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find({ status: { $ne: 'cancelled' } }).exec();
  }

  async findOne(id: string): Promise<Event> {
    return this.eventModel.findOne({ id }).exec();
  }

  async updateEvent(id: string, updateData: Partial<Event>): Promise<Event> {
    const event = await this.eventModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    ).exec();

    // Publish event updated message
    this.kafkaClient.emit(KafkaTopics.EVENT_UPDATED, {
      eventId: id,
      ...updateData,
    });

    return event;
  }

  async getAvailableSeats(eventId: string): Promise<Seat[]> {
    return this.seatModel.find({ 
      eventId, 
      status: 'available' 
    }).exec();
  }

  private async generateSeats(eventId: string, totalSeats: number, basePrice: number): Promise<void> {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = Math.ceil(totalSeats / rows.length);

    let seatCount = 0;
    for (const row of rows) {
      for (let seatNumber = 1; seatNumber <= seatsPerRow && seatCount < totalSeats; seatNumber++) {
        const seatId = `${eventId}_${row}${seatNumber}`;
        let seatType = 'regular';
        let seatPrice = basePrice;

        // Front rows are VIP
        if (['A', 'B'].includes(row)) {
          seatType = 'vip';
          seatPrice = basePrice * 1.5;
        }
        // Middle rows are premium
        else if (['C', 'D', 'E'].includes(row)) {
          seatType = 'premium';
          seatPrice = basePrice * 1.2;
        }

        seats.push({
          id: seatId,
          eventId,
          row,
          number: seatNumber,
          status: 'available',
          price: seatPrice,
          type: seatType,
        });

        seatCount++;
      }
    }

    await this.seatModel.insertMany(seats);
  }
} 