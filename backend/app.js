// backend/app.js
//
// Construye y devuelve la app Express. NO arranca el listener ni inicializa la DB —
// eso queda en server.js. Permite que los tests importen la app sin efectos secundarios.

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function createApp({ enableRateLimit = true } = {}) {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.set('trust proxy', 1);

    // Rate limit para /api (desactivable en tests)
    let apiMiddlewares = [];
    if (enableRateLimit) {
        const apiLimiter = rateLimit({
            windowMs: 60 * 1000,
            max: 120,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }
        });
        apiMiddlewares.push(apiLimiter);
    }

    const pinturaRoutes = require('./routes/pinturaRoutes');
    app.use('/api', ...apiMiddlewares, pinturaRoutes);

    app.get('/', (req, res) => {
        res.send('API de Galería de Arte activa.');
    });

    app.use((req, res) => {
        res.status(404).json({ error: 'Ruta no encontrada.' });
    });

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error('💥 Error no manejado:', err);
        const status = err.status || 500;
        const message = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor.'
            : err.message || 'Error interno del servidor.';
        res.status(status).json({ error: message });
    });

    return app;
}

module.exports = { createApp };
