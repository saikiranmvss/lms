/**
 * Migration: Add Razorpay columns to transactions table.
 * Compatible with MySQL 5.7+ — catches "column already exists" errors gracefully.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const COLUMNS = [
  { name: 'razorpay_order_id',   sql: 'ALTER TABLE transactions ADD COLUMN razorpay_order_id   VARCHAR(100)  DEFAULT NULL' },
  { name: 'razorpay_payment_id', sql: 'ALTER TABLE transactions ADD COLUMN razorpay_payment_id  VARCHAR(100)  DEFAULT NULL' },
  { name: 'razorpay_signature',  sql: 'ALTER TABLE transactions ADD COLUMN razorpay_signature   VARCHAR(255)  DEFAULT NULL' },
  { name: 'failure_reason',      sql: 'ALTER TABLE transactions ADD COLUMN failure_reason        VARCHAR(500)  DEFAULT NULL' },
];

const INDEXES = [
  { name: 'uq_tx_rzp_payment',    sql: 'CREATE UNIQUE INDEX uq_tx_rzp_payment    ON transactions (razorpay_payment_id)' },
  { name: 'idx_tx_student_course', sql: 'CREATE        INDEX idx_tx_student_course ON transactions (student_id, course_id)' },
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

  // Add indexes
  for (const { name, sql } of INDEXES) {
    try {
      await conn.query(sql);
      console.log(`✓  Added index   : ${name}`);
    } catch (err) {
      if (err.errno === 1061 || err.errno === 1062 || err.code === 'ER_DUP_KEYNAME') {
        console.log(`–  Already exists: ${name}`);
      } else {
        // Index on nullable unique col — non-fatal warning
        console.log(`!  Skipped index ${name}: ${err.message}`);
      }
    }
  }

  await conn.end();
  console.log('\n✅ Payment migration complete.');
}

run().catch((e) => { console.error(e); process.exit(1); });
