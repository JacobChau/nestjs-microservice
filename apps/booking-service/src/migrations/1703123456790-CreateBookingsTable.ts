import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBookingsTable1703123456790 implements MigrationInterface {
  name = 'CreateBookingsTable1703123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bookings table
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'db_id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'event_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'seat_ids',
            type: 'text',
            isArray: true,
            isNullable: false,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'payment_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_BOOKINGS_USER_ID',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_BOOKINGS_EVENT_ID',
            columnNames: ['event_id'],
          },
          {
            name: 'IDX_BOOKINGS_STATUS',
            columnNames: ['status'],
          },
          {
            name: 'IDX_BOOKINGS_CREATED_AT',
            columnNames: ['created_at'],
          },
          {
            name: 'IDX_BOOKINGS_USER_EVENT',
            columnNames: ['user_id', 'event_id'],
          },
        ],
      }),
      true,
    );

    // Create booking audit table for compliance
    await queryRunner.createTable(
      new Table({
        name: 'booking_audit',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'booking_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'old_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'new_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_AUDIT_BOOKING_ID',
            columnNames: ['booking_id'],
          },
          {
            name: 'IDX_AUDIT_TIMESTAMP',
            columnNames: ['timestamp'],
          },
          {
            name: 'IDX_AUDIT_ACTION',
            columnNames: ['action'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop audit table first
    await queryRunner.dropTable('booking_audit');
    
    // Drop bookings table
    await queryRunner.dropTable('bookings');
  }
} 