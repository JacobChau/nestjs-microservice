import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventController } from './controllers/event.controller';
import { AuthController } from './controllers/auth.controller';
import { BookingController } from './controllers/booking.controller';

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
          },
          consumer: {
            groupId: 'api-gateway-event-consumer',
            allowAutoTopicCreation: true,
          },
          subscribe: {
            fromBeginning: false,
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
          },
          consumer: {
            groupId: 'api-gateway-auth-consumer',
            allowAutoTopicCreation: true,
          },
          subscribe: {
            fromBeginning: false,
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
          },
          consumer: {
            groupId: 'api-gateway-booking-consumer',
            allowAutoTopicCreation: true,
          },
          subscribe: {
            fromBeginning: false,
          },
        },
      },
    ]),
  ],
  controllers: [EventController, AuthController, BookingController],
})
export class AppModule {} 