const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual vars if DATABASE_URL is not set
  host: process.env.DATABASE_URL ? undefined : process.env.PGHOST,
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.DATABASE_URL ? undefined : process.env.PGDATABASE,
  user: process.env.DATABASE_URL ? undefined : process.env.PGUSER,
  password: process.env.DATABASE_URL ? undefined : process.env.PGPASSWORD,
  // Shared hosting friendly pool settings
  max: parseInt(process.env.PG_POOL_MAX || '5', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('PostgreSQL connected successfully.'))
  .catch((err) => {
    console.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

// Helper: run a single query
const query = (text, params) => pool.query(text, params);

// Helper: get a client for transactions
const getClient = () => pool.connect();

// Graceful shutdown
const shutdown = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL pool closed.');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err.message);
  }
};

module.exports = { pool, query, getClient, shutdown };
