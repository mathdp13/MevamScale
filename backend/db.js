const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false 
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'mevamscale',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

module.exports = pool;