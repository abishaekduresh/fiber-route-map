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
  console.log('Adding "deletedAt" column to "users" table...');
  
  const hasColumn = await db.schema.hasColumn('users', 'deletedAt');
  if (!hasColumn) {
    await db.schema.table('users', (table) => {
      table.timestamp('deletedAt').nullable().after('updatedAt');
    });
    console.log('Column "deletedAt" added to "users" table.');
  } else {
    console.log('Column "deletedAt" already exists in "users" table.');
  }

  await db.destroy();
}

up().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
