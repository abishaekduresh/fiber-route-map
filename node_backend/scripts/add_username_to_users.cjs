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
  console.log('Adding "username" column to "users" table...');
  
  const hasColumn = await db.schema.hasColumn('users', 'username');
  if (!hasColumn) {
    // 1. Add nullable column first
    await db.schema.table('users', (table) => {
      table.string('username').nullable().after('id');
    });
    console.log('Column "username" added as nullable.');

    // 2. Populate existing users
    const users = await db('users').select('id', 'email');
    const usernames = new Set();

    for (const user of users) {
      let baseUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      let finalUsername = baseUsername;
      
      // Collision resolution
      let counter = 1;
      while (usernames.has(finalUsername.toLowerCase())) {
        finalUsername = `${baseUsername}_${user.id}_${counter}`;
        counter++;
      }
      
      usernames.add(finalUsername.toLowerCase());
      await db('users').where('id', user.id).update({ username: finalUsername });
      console.log(`Updated user ${user.id} (${user.email}) -> ${finalUsername}`);
    }

    // 3. Make it NOT NULL and UNIQUE
    await db.schema.alterTable('users', (table) => {
      table.string('username').notNullable().unique().alter();
    });
    console.log('Column "username" set to NOT NULL and UNIQUE.');
  } else {
    console.log('Column "username" already exists.');
  }

  await db.destroy();
}

up().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
