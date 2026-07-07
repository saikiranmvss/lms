import 'dotenv/config';
import pool from '../src/db/index.js';

async function test() {
  try {
    console.log('Testing query...');
    const res = await pool.query('SELECT * FROM users LIMIT 1');
    console.log('Result:', res);
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

test().then(() => process.exit(0));
