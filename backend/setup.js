// backend/setup.js

const db = require('./config/db');

// El SQL que crea la tabla (si no existe) e inserta datos
const setupSQL = `
    -- 1. Elimina la tabla si existe para asegurar una creación limpia
    DROP TABLE IF EXISTS pinturas CASCADE;

    -- 2. Crea la tabla
    CREATE TABLE pinturas (
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

    -- 3. Inserta datos de prueba
    INSERT INTO pinturas (titulo, url_imagen, tecnica, categoria, descripcion, fecha_creacion, precio) VALUES
    ('Abstracción Ultramar', 'https://picsum.photos/800/600?random=1', 'Óleo', 'pinturas', 'Estudio de azules profundos y texturas etéreas.', '2024-01-15', 550.00),
    ('Retrato Sombra', 'https://picsum.photos/800/600?random=2', 'Grafito', 'dibujos', 'Detalle hiperrealista con enfoque en la luz.', '2023-11-20', 120.00),
    ('Neón Urbano', 'https://picsum.photos/800/600?random=3', 'Digital', 'digital', 'Ilustración futurista inspirada en la noche de Tokio.', '2024-03-01', 80.00),
    ('Paisaje Esmeralda', 'https://picsum.photos/800/600?random=4', 'Acrílico', 'pinturas', 'Un paisaje de fantasía con tonos verdes vibrantes.', '2024-05-10', 400.00);
`;

async function initializeDatabase() {
    console.log('Iniciando la configuración de la base de datos...');
    try {
        await db.query(setupSQL);
        console.log('✅ Base de datos configurada: Tabla "pinturas" creada y datos insertados.');
    } catch (error) {
        console.error('❌ Error al configurar la base de datos:', error.message);
    } finally {
        // Necesitas salir del proceso una vez que la operación haya terminado
        // o el script seguirá esperando conexiones abiertas.
        process.exit(0);
    }
}

initializeDatabase();