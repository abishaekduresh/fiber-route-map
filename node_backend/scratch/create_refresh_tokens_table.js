import db from '../src/config/database.js';

async function createTable() {
  try {
    await db.schema.dropTableIfExists('tenant_refresh_tokens');
    await db.schema.createTable('tenant_refresh_tokens', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('tenantId').notNullable();
      table.string('token', 191).notNullable().unique();
      table.string('deviceId', 255);
      table.string('deviceName', 255);
      table.string('ipAddress', 45);
      table.text('userAgent');
      table.timestamp('expiresAt').notNullable();
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.timestamp('updatedAt').defaultTo(db.fn.now());
    });
    console.log('Table tenant_refresh_tokens created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
}

createTable();
