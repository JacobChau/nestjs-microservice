import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { UserEntity } from '../entities/user.entity';
import { RegisterUserDto, LoginUserDto, User, AuthToken, KafkaTopics } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email: registerUserDto.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real application, hash the password before saving
    const newUser = this.userRepository.create({
      ...registerUserDto,
      id: userId,
      tier: registerUserDto.tier || 'regular',
    });
    const savedUser = await this.userRepository.save(newUser);
    
    // Generate JWT token (simplified for demo)
    const token = `auth_token_${savedUser.id}_${Date.now()}`;
    
    const user: User = {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      phone: savedUser.phone,
      tier: savedUser.tier as 'regular' | 'premium' | 'vip',
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };

    // Publish user registered event
    this.kafkaClient.emit(KafkaTopics.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      timestamp: new Date(),
    });
    
    return { user, token };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: User; token: string } | { error: string }> {
    // In a real application, verify the password hash
    const userEntity = await this.userRepository.findOne({ 
      where: { email: loginUserDto.email } 
    });
    
    if (!userEntity) {
      return { error: 'Invalid credentials' };
    }
    
    // For demo purposes, we're not checking passwords
    // In a real app, you'd verify password hash here
    
    // Generate JWT token (simplified for demo)
    const token = `auth_token_${userEntity.id}_${Date.now()}`;
    
    const user: User = {
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      phone: userEntity.phone,
      tier: userEntity.tier as 'regular' | 'premium' | 'vip',
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };

    // Publish user authenticated event
    this.kafkaClient.emit(KafkaTopics.USER_AUTHENTICATED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
    
    return { user, token };
  }

  async validateToken(token: string): Promise<{ user: User } | { error: string }> {
    // In a real application, verify JWT token
    // This is a simplified validation for demo
    if (token && token.startsWith('auth_token_')) {
      // Extract userId from token format: auth_token_user_timestamp_randompart_finaltimestamp
      // Split and find the part that starts with 'user_'
      const parts = token.split('_');
      let userId = '';
      
      // Find the user ID that starts with 'user_'
      for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i] === 'user') {
          userId = `${parts[i]}_${parts[i + 1]}_${parts[i + 2]}`;
          break;
        }
      }
      
      if (!userId) {
        return { error: 'Invalid token format' };
      }
      
      // Check if user exists
      const userEntity = await this.userRepository.findOne({ 
        where: { id: userId } 
      });
      
      if (!userEntity) {
        return { error: 'Invalid token' };
      }

      const user: User = {
        id: userEntity.id,
        email: userEntity.email,
        name: userEntity.name,
        phone: userEntity.phone,
        tier: userEntity.tier as 'regular' | 'premium' | 'vip',
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
      };
      
      return { user };
    }
    
    return { error: 'Invalid token' };
  }

  async getUser(userId: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!userEntity) {
      return null;
    }

    return {
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      phone: userEntity.phone,
      tier: userEntity.tier as 'regular' | 'premium' | 'vip',
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };
  }
} 