import { Controller, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { KafkaTopics, RegisterUserDto, LoginUserDto, ApiResponse } from '@app/common';

@Controller('auth')
export class AuthController implements OnModuleInit {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to all reply topics first
    this.authClient.subscribeToResponseOf(KafkaTopics.USER_REGISTER);
    this.authClient.subscribeToResponseOf(KafkaTopics.USER_LOGIN);
    this.authClient.subscribeToResponseOf(KafkaTopics.USER_VALIDATE_TOKEN);
    this.authClient.subscribeToResponseOf(KafkaTopics.USER_FIND_ONE);
    
    // Then connect to Kafka
    await this.authClient.connect();
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto): Promise<ApiResponse> {
    try {
      const result = await firstValueFrom(
        this.authClient.send(KafkaTopics.USER_REGISTER, registerUserDto).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<ApiResponse> {
    try {
      const result = await firstValueFrom(
        this.authClient.send(KafkaTopics.USER_LOGIN, loginUserDto).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 