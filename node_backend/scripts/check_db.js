import 'dotenv/config';
import db from '../src/config/database.js';

async function checkUsers() {
  try {
    const users = await db('users').select('uuid', 'name', 'phone', 'email', 'status', 'createdAt', 'updatedAt');
    console.log('---BEGIN-USERS---');
    console.log(JSON.stringify(users, null, 2));
    console.log('---END-USERS---');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

checkUsers();
