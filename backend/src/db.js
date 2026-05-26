const { Pool } = require('pg');

// Einziger geteilter PostgreSQL-Pool für die gesamte App
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Fehler:', err.message);
});

module.exports = pool;
