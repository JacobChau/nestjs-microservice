import { DataSource } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class UserSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed...');
      return;
    }

    console.log('Seeding users...');

    const users = [
      {
        id: `user_${Date.now()}_${uuidv4().substring(0, 8)}`,
        email: 'demo1@test.com',
        name: 'Demo User 1',
        password: await bcrypt.hash('demo123', 10),
        tier: 'regular' as const,
        phone: '+1234567890',
      },
      {
        id: `user_${Date.now() + 1}_${uuidv4().substring(0, 8)}`,
        email: 'demo2@test.com',
        name: 'Demo User 2',
        password: await bcrypt.hash('demo123', 10),
        tier: 'premium' as const,
        phone: '+1234567891',
      },
      {
        id: `user_${Date.now() + 2}_${uuidv4().substring(0, 8)}`,
        email: 'demo3@test.com',
        name: 'Demo User 3',
        password: await bcrypt.hash('demo123', 10),
        tier: 'vip' as const,
        phone: '+1234567892',
      },
      {
        id: `user_${Date.now() + 3}_${uuidv4().substring(0, 8)}`,
        email: 'admin@test.com',
        name: 'Admin User',
        password: await bcrypt.hash('admin123', 10),
        tier: 'vip' as const,
        phone: '+1234567893',
      },
      {
        id: `user_${Date.now() + 4}_${uuidv4().substring(0, 8)}`,
        email: 'taylor.swift@music.com',
        name: 'Taylor Swift',
        password: await bcrypt.hash('swiftie123', 10),
        tier: 'vip' as const,
        phone: '+1234567894',
      },
    ];

    // Create additional test users for load testing
    for (let i = 5; i <= 50; i++) {
      users.push({
        id: `user_${Date.now() + i}_${uuidv4().substring(0, 8)}`,
        email: `testuser${i}@test.com`,
        name: `Test User ${i}`,
        password: await bcrypt.hash('test123', 10),
        tier: i % 3 === 0 ? 'vip' : i % 2 === 0 ? 'premium' : 'regular' as const,
        phone: `+123456789${i.toString().padStart(2, '0')}`,
      });
    }

    await userRepository.save(users);

    console.log(`✅ Successfully seeded ${users.length} users`);
    console.log('Demo users created:');
    console.log('  • demo1@test.com / demo123 (regular)');
    console.log('  • demo2@test.com / demo123 (premium)');
    console.log('  • demo3@test.com / demo123 (vip)');
    console.log('  • admin@test.com / admin123 (vip)');
    console.log('  • taylor.swift@music.com / swiftie123 (vip)');
    console.log(`  • testuser5-50@test.com / test123 (various tiers)`);
  }
} 