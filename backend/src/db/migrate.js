import 'dotenv/config';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${database}\``);

  const sqlPath = path.join(__dirname, 'schema_mysql.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log('Database migrated successfully.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
