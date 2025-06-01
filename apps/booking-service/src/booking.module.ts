import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BookingController } from './controllers/booking.controller';
import { BookingService } from './services/booking.service';
import { BookingEntity } from './entities/booking.entity';

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
      synchronize: false, // Use migrations instead
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
          },
          consumer: {
            groupId: 'booking-event-consumer',
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
          },
          consumer: {
            groupId: 'booking-auth-consumer',
          },
        },
      },
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'booking-service-producer',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {} 