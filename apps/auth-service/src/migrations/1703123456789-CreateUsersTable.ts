import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1703123456789 implements MigrationInterface {
  name = 'CreateUsersTable1703123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'tier',
            type: 'enum',
            enum: ['regular', 'premium', 'vip'],
            default: "'regular'",
            isNullable: false,
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
            name: 'IDX_USERS_EMAIL',
            columnNames: ['email'],
          },
          {
            name: 'IDX_USERS_ID',
            columnNames: ['id'],
          },
          {
            name: 'IDX_USERS_TIER',
            columnNames: ['tier'],
          },
          {
            name: 'IDX_USERS_CREATED_AT',
            columnNames: ['created_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (indexes will be dropped automatically)
    await queryRunner.dropTable('users');
  }
} 