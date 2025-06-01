import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport, ClientKafka } from '@nestjs/microservices';
import { BookingController } from './controllers/booking.controller';
import { BookingService } from './services/booking.service';
import { RedisSeatService } from './services/redis-seat.service';
import { BookingEntity } from './entities/booking.entity';
import { KafkaTopics } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'bookings_demo',
      entities: [BookingEntity],
      synchronize: true, // Auto-create tables for demo
      logging: ['error'],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false, // Run migrations manually
    }),
    TypeOrmModule.forFeature([BookingEntity]),
    ClientsModule.register([
      {
        name: 'EVENT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'booking-event-client',
            brokers: ['localhost:9092'],
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
              retries: 3,
              initialRetryTime: 100,
            },
          },
          consumer: {
            groupId: 'booking-event-consumer',
            allowAutoTopicCreation: true,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
          },
          producer: {
            createPartitioner: require('kafkajs').Partitioners.LegacyPartitioner,
          },
        },
      },
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'booking-auth-client',
            brokers: ['localhost:9092'],
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
              retries: 3,
              initialRetryTime: 100,
            },
          },
          consumer: {
            groupId: 'booking-auth-consumer',
            allowAutoTopicCreation: true,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
          },
          producer: {
            createPartitioner: require('kafkajs').Partitioners.LegacyPartitioner,
          },
        },
      },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService, RedisSeatService],
})
export class BookingModule implements OnModuleInit {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientKafka,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to reply topics for request-response patterns
    const eventTopics = [
      KafkaTopics.SEAT_FIND_AVAILABLE,
      KafkaTopics.SEAT_RESERVE,
      KafkaTopics.SEAT_RELEASE,
    ];

    const authTopics = [
      KafkaTopics.USER_VALIDATE_TOKEN,
      KafkaTopics.USER_FIND_ONE,
    ];

    // Subscribe to event service reply topics
    eventTopics.forEach(topic => {
      this.eventClient.subscribeToResponseOf(topic);
    });

    // Subscribe to auth service reply topics
    authTopics.forEach(topic => {
      this.authClient.subscribeToResponseOf(topic);
    });

    // Connect the clients
    await Promise.all([
      this.eventClient.connect(),
      this.authClient.connect(),
    ]);

    console.log('🔗 Booking Service Kafka clients connected and subscribed to reply topics');
  }
} 