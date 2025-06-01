import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Inject, 
  Headers, 
  UnauthorizedException,
  OnModuleInit
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { KafkaTopics, CreateBookingDto, ApiResponse } from '@app/common';

@Controller('bookings')
export class BookingController implements OnModuleInit {
  constructor(
    @Inject('BOOKING_SERVICE') private bookingClient: ClientKafka,
    @Inject('AUTH_SERVICE') private authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to booking service reply topics
    this.bookingClient.subscribeToResponseOf(KafkaTopics.BOOKING_CREATE);
    this.bookingClient.subscribeToResponseOf(KafkaTopics.BOOKING_FIND_ALL);
    this.bookingClient.subscribeToResponseOf(KafkaTopics.BOOKING_FIND_ONE);
    this.bookingClient.subscribeToResponseOf(KafkaTopics.BOOKING_CANCEL);
    this.bookingClient.subscribeToResponseOf(KafkaTopics.BOOKING_CONFIRM);
    
    // Subscribe to auth service reply topics
    this.authClient.subscribeToResponseOf(KafkaTopics.USER_VALIDATE_TOKEN);
    
    // Connect to Kafka
    await this.bookingClient.connect();
    await this.authClient.connect();
  }

  private async validateAndGetUserId(authorization: string): Promise<string> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization token required');
    }

    try {
      const result = await firstValueFrom(
        this.authClient.send(KafkaTopics.USER_VALIDATE_TOKEN, { token: authorization }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      if (result.error) {
        throw new UnauthorizedException(result.error);
      }
      
      return result.user.id;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post()
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Headers('authorization') authorization: string
  ): Promise<ApiResponse> {
    try {
      const userId = await this.validateAndGetUserId(authorization);
      
      const booking = await firstValueFrom(
        this.bookingClient.send(KafkaTopics.BOOKING_CREATE, { createBookingDto, userId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: booking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get()
  async getBookings(@Headers('authorization') authorization: string): Promise<ApiResponse> {
    try {
      const userId = await this.validateAndGetUserId(authorization);
      
      const bookings = await firstValueFrom(
        this.bookingClient.send(KafkaTopics.BOOKING_FIND_ALL, { userId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: bookings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get(':id')
  async getBooking(
    @Param('id') bookingId: string,
    @Headers('authorization') authorization: string
  ): Promise<ApiResponse> {
    try {
      await this.validateAndGetUserId(authorization);
      
      const booking = await firstValueFrom(
        this.bookingClient.send(KafkaTopics.BOOKING_FIND_ONE, { bookingId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: booking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put(':id/cancel')
  async cancelBooking(
    @Param('id') bookingId: string,
    @Headers('authorization') authorization: string
  ): Promise<ApiResponse> {
    try {
      await this.validateAndGetUserId(authorization);
      
      const result = await firstValueFrom(
        this.bookingClient.send(KafkaTopics.BOOKING_CANCEL, { bookingId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put(':id/confirm')
  async confirmBooking(
    @Param('id') bookingId: string,
    @Body() data: { paymentId: string },
    @Headers('authorization') authorization: string
  ): Promise<ApiResponse> {
    try {
      await this.validateAndGetUserId(authorization);
      
      const result = await firstValueFrom(
        this.bookingClient.send(KafkaTopics.BOOKING_CONFIRM, { bookingId, paymentId: data.paymentId }).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 