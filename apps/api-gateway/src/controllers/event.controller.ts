import { Controller, Get, Post, Body, Param, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { KafkaTopics, CreateEventDto, ApiResponse } from '@app/common';

@Controller('events')
export class EventController implements OnModuleInit {
  constructor(
    @Inject('EVENT_SERVICE') private eventClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to all reply topics first
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_CREATE);
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_FIND_ALL);
    this.eventClient.subscribeToResponseOf(KafkaTopics.EVENT_FIND_ONE);
    this.eventClient.subscribeToResponseOf(KafkaTopics.SEAT_FIND_AVAILABLE);
    
    // Then connect to Kafka
    await this.eventClient.connect();
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
      return { success: false, error: error.message };
    }
  }

  @Get()
  async getEvents(): Promise<ApiResponse> {
    try {
      const events = await firstValueFrom(
        this.eventClient.send(KafkaTopics.EVENT_FIND_ALL, {}).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: events };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':id')
  async getEvent(@Param('id') id: string): Promise<ApiResponse> {
    try {
      const event = await firstValueFrom(
        this.eventClient.send(KafkaTopics.EVENT_FIND_ONE, { id }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: event };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':id/seats')
  async getAvailableSeats(@Param('id') eventId: string): Promise<ApiResponse> {
    try {
      const seats = await firstValueFrom(
        this.eventClient.send(KafkaTopics.SEAT_FIND_AVAILABLE, { eventId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: seats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 