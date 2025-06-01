import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KafkaTopics, User, RegisterUserDto, LoginUserDto } from '@app/common';
import { AuthService } from '../services/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(KafkaTopics.USER_REGISTER)
  register(@Payload() registerUserDto: RegisterUserDto): Promise<{ user: User; token: string }> {
    return this.authService.register(registerUserDto);
  }

  @MessagePattern(KafkaTopics.USER_LOGIN)
  login(@Payload() loginUserDto: LoginUserDto): Promise<{ user: User; token: string } | { error: string }> {
    return this.authService.login(loginUserDto);
  }

  @MessagePattern(KafkaTopics.USER_VALIDATE_TOKEN)
  validateToken(@Payload() data: { token: string }): Promise<{ user: User } | { error: string }> {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern(KafkaTopics.USER_FIND_ONE)
  getUser(@Payload() data: { userId: string }): Promise<User | null> {
    return this.authService.getUser(data.userId);
  }
} 