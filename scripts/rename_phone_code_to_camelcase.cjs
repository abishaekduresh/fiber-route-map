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
  console.log('Renaming column "phone_code" to "phoneCode" in "countries" table...');
  
  const hasColumn = await db.schema.hasColumn('countries', 'phone_code');
  if (hasColumn) {
    await db.schema.alterTable('countries', (table) => {
      table.renameColumn('phone_code', 'phoneCode');
    });
    console.log('Column renamed successfully.');
  } else {
    console.log('Column "phone_code" not found. It might have already been renamed.');
  }

  await db.destroy();
}

up().catch(err => {
  console.error('Error during rename:', err);
  process.exit(1);
});
