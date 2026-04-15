const { Pool } = require('pg');
// Só carrega dotenv localmente
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../.env' });
}

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } 
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'mevamscale',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// Log de diagnóstico
pool.on('error', (err) => {
    console.error(' Erro inesperado no cliente do banco:', err);
});

module.exports = pool;