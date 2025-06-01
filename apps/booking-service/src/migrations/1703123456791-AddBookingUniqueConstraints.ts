import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingUniqueConstraints1703123456791 implements MigrationInterface {
  name = 'AddBookingUniqueConstraints1703123456791';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index to prevent duplicate active bookings for same user+event+seats
    // This allows only one confirmed booking per user per event per seat
    await queryRunner.query(`
      CREATE UNIQUE INDEX CONCURRENTLY idx_unique_user_event_seats_confirmed 
      ON bookings (user_id, event_id, (seat_ids::text)) 
      WHERE status = 'confirmed'
    `);

    // Add index to prevent multiple pending bookings for same user+event
    // This allows only one pending booking per user per event at a time
    await queryRunner.query(`
      CREATE UNIQUE INDEX CONCURRENTLY idx_unique_user_event_pending 
      ON bookings (user_id, event_id) 
      WHERE status = 'pending'
    `);

    // Add index for fast lookup of user's active bookings
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_bookings_user_status_event 
      ON bookings (user_id, status, event_id)
    `);

    // Add index for seat availability checks
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_bookings_event_seats_status 
      ON bookings USING GIN (event_id, seat_ids, status)
    `);

    // Add partial index for active bookings (confirmed + pending)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_bookings_active 
      ON bookings (event_id, user_id, status, created_at) 
      WHERE status IN ('pending', 'confirmed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_user_event_seats_confirmed`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_user_event_pending`);
    
    // Drop the performance indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_user_status_event`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_event_seats_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_active`);
  }
} 