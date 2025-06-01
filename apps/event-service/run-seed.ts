import { NestFactory } from '@nestjs/core';
import { EventModule } from './src/event.module';
import { EventSeeder } from './src/seeds/event.seed';

async function runSeed() {
  try {
    console.log('🌱 Initializing NestJS application...');
    const app = await NestFactory.createApplicationContext(EventModule);
    
    console.log('🌱 Running Event Service seeds...');
    const seeder = app.get(EventSeeder);
    await seeder.run();
    
    console.log('✅ Event Service seeding completed');
    await app.close();
  } catch (error) {
    console.error('❌ Event Service seeding failed:', error);
    process.exit(1);
  }
}

runSeed(); 