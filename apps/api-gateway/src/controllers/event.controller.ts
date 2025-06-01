import { Controller, Get, Post, Body, Param, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateEventDto, KafkaTopics, ApiResponse } from '@app/common';

@Controller('events')
export class EventController implements OnModuleInit {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientKafka,
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to all reply topics first
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_CREATE);
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_FIND_ALL);
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_FIND_ONE);
    this.eventClient.subscribeToResponseOf(KafkaTopics.SEAT_FIND_AVAILABLE);
    this.eventClient.subscribeToResponseOf('SEAT_FIND_ALL');
    
    // Subscribe to booking service topics
    this.bookingClient.subscribeToResponseOf('SEAT_AVAILABILITY_GET');
    this.bookingClient.subscribeToResponseOf('SEAT_STATUS_REALTIME');
    
    // Then connect to Kafka
    await this.eventClient.connect();
    await this.bookingClient.connect();
  }

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<ApiResponse> {
    try {
      const event = await firstValueFrom(
        this.eventClient.send(KafkaTopics.EVENT_CREATE, createEventDto).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: event };
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      return { success: false, error: error.message || 'Failed to create event' };
    }
  }

  @Get()
  async findAllEvents(): Promise<ApiResponse> {
    try {
      const events = await firstValueFrom(
        this.eventClient.send(KafkaTopics.EVENT_FIND_ALL, {}).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: events };
    } catch (error) {
      console.error('❌ Failed to fetch events:', error);
      return { success: false, error: error.message || 'Failed to fetch events' };
    }
  }

  @Get(':id')
  async findOneEvent(@Param('id') id: string): Promise<ApiResponse> {
    try {
      const event = await firstValueFrom(
        this.eventClient.send(KafkaTopics.EVENT_FIND_ONE, { id }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: event };
    } catch (error) {
      console.error('❌ Failed to fetch event:', error);
      return { success: false, error: error.message || 'Failed to fetch event' };
    }
  }

  @Get(':id/seats')
  async getAvailableSeats(@Param('id') eventId: string): Promise<ApiResponse> {
    try {
      // Use the new Redis-based seat availability from booking service
      const seatAvailability = await firstValueFrom(
        this.bookingClient.send('SEAT_AVAILABILITY_GET', { eventId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      // Generate all seats for the event (100 seats: 10 rows A-J × 10 seats each)
      const allSeats = [];
      for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
        const row = String.fromCharCode(65 + rowIndex); // A, B, C, ..., J
        for (let num = 1; num <= 10; num++) {
          const seatId = `${eventId}_${row}${num}`;
          
          // Determine seat status based on booking service data
          let status = 'available';
          if (seatAvailability.reserved.includes(seatId)) {
            status = 'reserved';
          } else if (seatAvailability.booked.includes(seatId)) {
            status = 'booked';
          }
          
          allSeats.push({
            id: seatId,
            eventId: eventId,
            row: row,
            number: num,
            status: status,
            price: 50, // Demo price
            type: row === 'A' ? 'premium' : 'regular'
          });
        }
      }
      
      // Sort seats by row and number
      allSeats.sort((a, b) => {
        if (a.row !== b.row) {
          return a.row.localeCompare(b.row);
        }
        return a.number - b.number;
      });
      
      return { success: true, data: allSeats };
    } catch (error) {
      console.error('❌ Failed to fetch seats:', error);
      return { success: false, error: error.message || 'Failed to fetch seats' };
    }
  }

  @Get(':id/seats/realtime')
  async getRealtimeSeatStatus(@Param('id') eventId: string): Promise<ApiResponse> {
    try {
      // Get detailed real-time seat status with reservation details
      const seatStatus = await firstValueFrom(
        this.bookingClient.send('SEAT_STATUS_REALTIME', { eventId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: seatStatus };
    } catch (error) {
      console.error('❌ Failed to fetch real-time seat status:', error);
      return { success: false, error: error.message || 'Failed to fetch real-time seat status' };
    }
  }
} 