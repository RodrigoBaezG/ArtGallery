// backend/server.js

require('dotenv').config();

const db = require('./config/db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;

const setupSQL = `
    CREATE TABLE IF NOT EXISTS pinturas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        url_imagen VARCHAR(500) NOT NULL,
        tecnica VARCHAR(100),
        categoria VARCHAR(50) NOT NULL,
        descripcion TEXT,
        fecha_creacion DATE,
        disponible BOOLEAN DEFAULT TRUE,
        precio NUMERIC(10, 2)
    );
`;

const insertDataSQL = `
    INSERT INTO pinturas (titulo, url_imagen, tecnica, categoria, descripcion, fecha_creacion, precio) VALUES
    ('Abstracción Ultramar', 'https://picsum.photos/800/600?random=1', 'Óleo', 'paintings', 'Estudio de azules profundos y texturas etéreas.', '2024-01-15', 550.00),
    ('Retrato Sombra', 'https://picsum.photos/800/600?random=2', 'Grafito', 'drawings', 'Detalle hiperrealista con enfoque en la luz.', '2023-11-20', 120.00),
    ('Neón Urbano', 'https://picsum.photos/800/600?random=3', 'Digital', 'digital', 'Ilustración futurista inspirada en la noche de Tokio.', '2024-03-01', 80.00),
    ('Paisaje Esmeralda', 'https://picsum.photos/800/600?random=4', 'Acrílico', 'paintings', 'Un paisaje de fantasía con tonos verdes vibrantes.', '2024-05-10', 400.00);
`;

async function initializeDatabase() {
    try {
        await db.query(setupSQL);
        console.log('✅ Verificación de tabla "pinturas" completada.');

        const countResult = await db.query('SELECT COUNT(*) FROM pinturas');
        const rowCount = parseInt(countResult.rows[0].count);

        if (rowCount === 0) {
            await db.query(insertDataSQL);
            console.log('🖼️ Datos de prueba insertados exitosamente.');
        } else {
            console.log(`Datos encontrados (${rowCount} obras). Omitiendo la inserción.`);
        }
    } catch (error) {
        console.error('❌ Error fatal al inicializar la base de datos:', error.message);
        process.exit(1);
    }
}

const app = createApp();

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});
