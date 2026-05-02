import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const hasColumn = await db.schema.hasColumn('tenants', 'sessionLimit');
    if (!hasColumn) {
      await db.schema.alterTable('tenants', (table) => {
        table.integer('sessionLimit').notNullable().defaultTo(1).after('status');
      });
      console.log('Added sessionLimit column to tenants table');
    } else {
      console.log('sessionLimit column already exists in tenants table');
    }
  } catch (error) {
    console.error('Error upgrading database:', error);
  } finally {
    await db.destroy();
  }
}

upgrade();
