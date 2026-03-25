const knex = require('knex');
require('dotenv').config();

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
  console.log('Ensuring "countries" table uses InnoDB engine...');
  await db.raw('ALTER TABLE countries ENGINE=InnoDB');

  console.log('Adding "countryId" column to "users" table...');
  
  const hasColumn = await db.schema.hasColumn('users', 'countryId');
  if (hasColumn) {
    console.log('Column "countryId" already exists in "users" table. Skipping.');
  } else {
    await db.schema.alterTable('users', (table) => {
      table.integer('countryId').unsigned().nullable().after('status');
      table.foreign('countryId').references('id').inTable('countries').onDelete('SET NULL');
    });
    console.log('Column "countryId" added successfully to "users" table.');
  }

  await db.destroy();
}

up().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
