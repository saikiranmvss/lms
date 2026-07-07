/**
 * Idempotent first-time schema setup (safe on every deploy).
 * Applies schema_mysql.sql only when the `users` table is missing.
 * Seeds demo accounts when the database is empty.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function usersTableExists(conn) {
  const [rows] = await conn.query(
    `SELECT 1 AS ok FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'users' LIMIT 1`,
  );
  return rows.length > 0;
}

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} exited with code ${code}`));
    });
  });
}

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME || 'lms';

  const conn = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true,
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.query(`USE \`${database}\``);

  if (!(await usersTableExists(conn))) {
    console.log('LMS schema not found — applying schema_mysql.sql');
    const sqlPath = path.join(__dirname, 'schema_mysql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await conn.query(sql);
    console.log('Schema applied.');
  } else {
    console.log('LMS schema already present — skipping DDL.');
  }

  const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM users');
  await conn.end();

  // Run migrations to apply new schema adjustments (payments, gamification, etc.)
  console.log('Applying database schema migrations...');
  await runScript('src/db/migrate-payments.js');
  await runScript('src/db/migrate-gamification.js');

  if (Number(c) === 0) {
    console.log('No users found — running seed.js');
    await runScript('src/db/seed.js');
  } else {
    console.log(`Database has ${c} user(s) — skipping seed.`);
  }

  console.log('ensure-schema finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
