// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const DB_HOST = 'localhost';
const DB_PORT = 5432; // Asegúrate de que este sea el puerto de tu instalación de PostgreSQL
const DB_NAME = 'artgallery';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar con PostgreSQL:', err.stack);
    }

    client.query('SET search_path TO public', (setErr) => {
        if (setErr) {
            console.error('Error al establecer el search_path:', setErr.stack);
        }
        console.log(`Conexión a PostgreSQL exitosa en DB: ${DB_NAME}`);
        // Liberar el cliente después de configurar la ruta
        release(); 
    });
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};