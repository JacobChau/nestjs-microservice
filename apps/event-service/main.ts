import { NestFactory } from '@nestjs/core';
import { EventModule } from './src/event.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(EventModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'event-service',
        brokers: ['localhost:9092'],
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          retries: 5,
          initialRetryTime: 100,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId: 'event-service-consumer',
        allowAutoTopicCreation: true,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          retries: 5,
          initialRetryTime: 100,
        },
      },
      producer: {
        createPartitioner: require('kafkajs').Partitioners.LegacyPartitioner,
      },
    },
  });

  await app.listen();
  console.log('🎭 Event Service is listening on Kafka');
}

bootstrap(); 