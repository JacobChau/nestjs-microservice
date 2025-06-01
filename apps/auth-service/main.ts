import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from './src/auth.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'auth-service',
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
          groupId: 'auth-service-consumer',
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
    },
  );
  
  await app.listen();
  console.log('🔐 Auth Service is listening on Kafka');
}

bootstrap(); 