import 'dotenv/config';
import db from '../src/config/database.js';

async function checkSchema() {
  try {
    const columns = await db('users').columnInfo();
    console.log('Current Attributes in users table:');
    console.log(Object.keys(columns));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching schema:', error);
    process.exit(1);
  }
}

checkSchema();
