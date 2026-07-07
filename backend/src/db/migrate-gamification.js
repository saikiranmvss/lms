/**
 * Migration: Add Gamification columns to users table.
 * Safe — catches duplicates gracefully for MySQL 5.7+ compatibility.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const COLUMNS = [
  { name: 'daily_streak',       sql: 'ALTER TABLE users ADD COLUMN daily_streak       INT          DEFAULT 0' },
  { name: 'last_active_date',   sql: 'ALTER TABLE users ADD COLUMN last_active_date   DATE         DEFAULT NULL' },
  { name: 'experience_points',  sql: 'ALTER TABLE users ADD COLUMN experience_points  INT          DEFAULT 0' },
  { name: 'badges',             sql: 'ALTER TABLE users ADD COLUMN badges             JSON         DEFAULT NULL' },
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'lms',
  });

  // Add columns
  for (const { name, sql } of COLUMNS) {
    try {
      await conn.query(sql);
      console.log(`✓  Added column  : ${name}`);
    } catch (err) {
      if (err.errno === 1060) { // ER_DUP_FIELDNAME
        console.log(`–  Already exists: ${name}`);
      } else {
        throw err;
      }
    }
  }

  await conn.end();
  console.log('\n✅ Gamification migration complete.');
}

run().catch((e) => { console.error(e); process.exit(1); });
