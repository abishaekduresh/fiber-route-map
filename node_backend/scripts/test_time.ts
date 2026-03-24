import 'dotenv/config';
import { nowDb } from '../src/utils/time.js';

console.log('--- Testing Timezone ---');
console.log('Configured Timezone:', process.env.TIMEZONE || 'Not set (defaulting to Asia/Kolkata)');
console.log('Current Date Object:', new Date().toString());
console.log('Generated DB Timestamp:', nowDb());
