import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './controllers/event.controller';
import { SeatController } from './controllers/seat.controller';
import { EventService } from './services/event.service';
import { SeatService } from './services/seat.service';
import { Event, EventSchema } from './schemas/event.schema';
import { Seat, SeatSchema } from './schemas/seat.schema';
import { EventSeeder } from './seeds/event.seed';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://mongo:mongo@localhost:27017/events_demo?authSource=admin'
    ),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Seat.name, schema: SeatSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'event-service-producer',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [EventController, SeatController],
  providers: [EventService, SeatService, EventSeeder],
})
export class EventModule {} 