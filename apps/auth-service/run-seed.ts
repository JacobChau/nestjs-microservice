import { DataSource } from 'typeorm';
import ormConfig from './ormconfig';
import { UserSeeder } from './src/seeds/user.seed';

async function runSeed() {
  try {
    console.log('🌱 Initializing database connection...');
    const dataSource = await ormConfig.initialize();
    
    console.log('🌱 Running Auth Service seeds...');
    const seeder = new UserSeeder(dataSource);
    await seeder.run();
    
    console.log('✅ Auth Service seeding completed');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Auth Service seeding failed:', error);
    process.exit(1);
  }
}

runSeed(); 