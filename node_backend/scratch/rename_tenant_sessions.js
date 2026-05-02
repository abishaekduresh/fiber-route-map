import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  }
});

async function upgrade() {
  try {
    const hasOldTable = await db.schema.hasTable('tenant_refresh_tokens');
    const hasNewTable = await db.schema.hasTable('tenant_sessions');

    if (hasOldTable || hasNewTable) {
      if (hasOldTable && !hasNewTable) {
        console.log('Renaming tenant_refresh_tokens to tenant_sessions...');
        await db.schema.renameTable('tenant_refresh_tokens', 'tenant_sessions');
      }
      
      const hasUuid = await db.schema.hasColumn('tenant_sessions', 'uuid');
      const hasToken = await db.schema.hasColumn('tenant_sessions', 'token');

      if (!hasUuid || hasToken) {
        await db.schema.alterTable('tenant_sessions', (table) => {
          if (!hasUuid) table.string('uuid', 36).nullable().after('id');
          if (hasToken) table.renameColumn('token', 'sessionToken');
        });
        
        // Update existing rows with UUIDs
        const sessions = await db('tenant_sessions').whereNull('uuid').orWhere('uuid', '').select('id');
        for (const session of sessions) {
          await db('tenant_sessions').where('id', session.id).update({ uuid: uuidv4() });
        }

        await db.schema.alterTable('tenant_sessions', (table) => {
          table.string('uuid', 36).notNullable().unique().alter();
        });
      }
      
      console.log('Successfully updated tenant_sessions table.');
    } else if (!hasOldTable && !hasNewTable) {
      console.log('Creating tenant_sessions table...');
      await db.schema.createTable('tenant_sessions', (table) => {
        table.increments('id').primary();
        table.string('uuid', 36).notNullable().unique();
        table.integer('tenantId').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        table.string('sessionToken', 500).notNullable().unique();
        table.string('deviceId', 255).nullable();
        table.string('deviceName', 255).nullable();
        table.string('ipAddress', 45).nullable();
        table.text('userAgent').nullable();
        table.timestamp('expiresAt').notNullable();
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('Successfully created tenant_sessions table.');
    } else {
      console.log('tenant_sessions table already exists.');
    }
  } catch (error) {
    console.error('Error upgrading database:', error);
  } finally {
    await db.destroy();
  }
}

upgrade();
