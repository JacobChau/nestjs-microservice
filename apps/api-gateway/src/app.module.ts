import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ClientsModule, Transport, ClientKafka } from '@nestjs/microservices';
import { EventController } from './controllers/event.controller';
import { AuthController } from './controllers/auth.controller';
import { BookingController } from './controllers/booking.controller';
import { KafkaTopics } from '@app/common';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EVENT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-event-client',
            brokers: ['localhost:9092'],
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
              retries: 3,
              initialRetryTime: 100,
            },
          },
          consumer: {
            groupId: 'api-gateway-event-consumer',
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
            clientId: 'api-gateway-auth-client',
            brokers: ['localhost:9092'],
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
              retries: 3,
              initialRetryTime: 100,
            },
          },
          consumer: {
            groupId: 'api-gateway-auth-consumer',
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
        name: 'BOOKING_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-booking-client',
            brokers: ['localhost:9092'],
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
              retries: 3,
              initialRetryTime: 100,
            },
          },
          consumer: {
            groupId: 'api-gateway-booking-consumer',
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
  controllers: [EventController, AuthController, BookingController],
})
export class AppModule implements OnModuleInit {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientKafka,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to reply topics for request-response patterns
    const eventTopics = [
      KafkaTopics.EVENT_FIND_ALL,
      KafkaTopics.EVENT_FIND_ONE,
      KafkaTopics.SEAT_FIND_AVAILABLE,
    ];

    const authTopics = [
      KafkaTopics.USER_LOGIN,
      KafkaTopics.USER_VALIDATE_TOKEN,
      KafkaTopics.USER_FIND_ONE,
    ];

    const bookingTopics = [
      KafkaTopics.BOOKING_CREATE,
      KafkaTopics.BOOKING_CONFIRM,
      KafkaTopics.BOOKING_CANCEL,
      KafkaTopics.BOOKING_FIND_ALL,
    ];

    // Subscribe to reply topics
    eventTopics.forEach(topic => {
      this.eventClient.subscribeToResponseOf(topic);
    });

    authTopics.forEach(topic => {
      this.authClient.subscribeToResponseOf(topic);
    });

    bookingTopics.forEach(topic => {
      this.bookingClient.subscribeToResponseOf(topic);
    });

    // Connect the clients
    await Promise.all([
      this.eventClient.connect(),
      this.authClient.connect(),
      this.bookingClient.connect(),
    ]);

    console.log('🚪 API Gateway Kafka clients connected and subscribed to reply topics');
  }
} 