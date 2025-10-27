// backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db'); // Importa la conexión a DB
const app = express();
const PORT = process.env.PORT || 5000;

// SQL de creación de tabla (solo si no existe)
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

// SQL para insertar datos DE PRUEBA
const insertDataSQL = `
    INSERT INTO pinturas (titulo, url_imagen, tecnica, categoria, descripcion, fecha_creacion, precio) VALUES
    ('Abstracción Ultramar', 'https://picsum.photos/800/600?random=1', 'Óleo', 'pinturas', 'Estudio de azules profundos y texturas etéreas.', '2024-01-15', 550.00),
    ('Retrato Sombra', 'https://picsum.photos/800/600?random=2', 'Grafito', 'dibujos', 'Detalle hiperrealista con enfoque en la luz.', '2023-11-20', 120.00),
    ('Neón Urbano', 'https://picsum.photos/800/600?random=3', 'Digital', 'digital', 'Ilustración futurista inspirada en la noche de Tokio.', '2024-03-01', 80.00),
    ('Paisaje Esmeralda', 'https://picsum.photos/800/600?random=4', 'Acrílico', 'pinturas', 'Un paisaje de fantasía con tonos verdes vibrantes.', '2024-05-10', 400.00);
`;


async function initializeDatabase() {
    try {
        // 1. Aseguramos que la tabla exista (IF NOT EXISTS)
        await db.query(setupSQL);
        console.log('✅ Verificación de tabla "pinturas" completada.');

        // 2. Comprobamos si la tabla tiene datos
        const countResult = await db.query('SELECT COUNT(*) FROM pinturas');
        const rowCount = parseInt(countResult.rows[0].count);

        if (rowCount === 0) {
            // 3. Insertamos datos SOLO si la tabla está vacía
            await db.query(insertDataSQL);
            console.log('🖼️ Datos de prueba insertados exitosamente.');
        } else {
            console.log(`Datos encontrados (${rowCount} obras). Omitiendo la inserción.`);
        }

    } catch (error) {
        // Si la inicialización falla, no permitimos que el servidor arranque.
        console.error('❌ Error fatal al inicializar la base de datos:', error.message);
        process.exit(1);
    }
}

// Rutas
const pinturaRoutes = require('./routes/pinturaRoutes');

// Middlewares
app.use(cors()); // Permite que el frontend acceda
app.use(express.json()); 

// Montar rutas
app.use('/api', pinturaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Galería de Arte activa.');
});

// Arrancar el servidor SOLO después de inicializar la DB
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});