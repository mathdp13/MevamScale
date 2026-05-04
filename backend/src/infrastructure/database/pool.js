const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'mevamscale',
        password: process.env.DB_PASSWORD || 'postgres',
        port: Number(process.env.DB_PORT) || 5432,
      }
);

pool.on('error', (err) => console.error('Erro inesperado no pool do banco:', err));

module.exports = pool;
