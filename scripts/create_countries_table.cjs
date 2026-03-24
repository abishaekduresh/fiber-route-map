const knex = require('knex');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'fiber_route_map',
  }
});

async function up() {
  console.log('Creating countries table...');
  
  const hasTable = await db.schema.hasTable('countries');
  if (hasTable) {
    console.log('Table "countries" already exists. Skipping creation.');
  } else {
    await db.schema.createTable('countries', (table) => {
      table.increments('id').primary();
      table.string('uuid', 36).notNullable().unique();
      table.string('name', 255).notNullable();
      table.string('code', 10).notNullable().unique();
      table.string('phone_code', 10).notNullable();
      table.enum('status', ['active', 'blocked', 'deleted']).defaultTo('active');
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.timestamp('updatedAt').defaultTo(db.fn.now());
      table.timestamp('deletedAt').nullable();
    });
    console.log('Table "countries" created successfully.');
  }

  // Seed data
  const count = await db('countries').count('* as count').first();
  if (Number(count.count) === 0) {
    console.log('Seeding initial countries...');
    const countries = [
      { uuid: uuidv4(), name: 'India', code: 'IN', phone_code: '+91', status: 'active' },
      { uuid: uuidv4(), name: 'United States', code: 'US', phone_code: '+1', status: 'active' },
      { uuid: uuidv4(), name: 'United Kingdom', code: 'GB', phone_code: '+44', status: 'active' },
      { uuid: uuidv4(), name: 'United Arab Emirates', code: 'AE', phone_code: '+971', status: 'active' },
      { uuid: uuidv4(), name: 'Singapore', code: 'SG', phone_code: '+65', status: 'active' },
    ];
    await db('countries').insert(countries);
    console.log(`Seeded ${countries.length} countries.`);
  }

  await db.destroy();
}

up().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
