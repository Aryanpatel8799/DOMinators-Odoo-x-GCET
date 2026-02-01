const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('📦 Database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle database client', err);
    process.exit(-1);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};
