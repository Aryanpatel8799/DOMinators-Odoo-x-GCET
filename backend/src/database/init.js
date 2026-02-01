require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('Initializing database...');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await client.query(schema);
        
        console.log('Database schema created successfully!');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

initializeDatabase()
    .then(() => {
        console.log('Database initialization complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
