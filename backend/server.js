// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Usa la variable de entorno PORT, o 5000 por defecto
const PORT = process.env.PORT || 5000; 

// Inicializa la conexión a DB
require('./config/db'); 

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Rutas
const pinturaRoutes = require('./routes/pinturaRoutes');
app.use('/api', pinturaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Galería de Arte activa.');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});