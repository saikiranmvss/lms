import mysql from 'mysql2/promise';

const rawPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'lms',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
});

function pgParamsToMysql(sql, params = []) {
  const newParams = [];
  const out = sql.replace(/\$(\d+)/g, (_, n) => {
    newParams.push(params[parseInt(n, 10) - 1]);
    return '?';
  });
  return [out, newParams];
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const o = { ...row };
  for (const k of Object.keys(o)) {
    if (typeof o[k] === 'bigint') o[k] = Number(o[k]);
  }
  return o;
}

const pool = {
  async query(text, params = []) {
    const [sql, vals] = pgParamsToMysql(text, params);
    const [rows] = await rawPool.query(sql, vals);
    if (Array.isArray(rows)) {
      return { rows: rows.map(normalizeRow) };
    }
    return { rows: [] };
  },
};

export default pool;
