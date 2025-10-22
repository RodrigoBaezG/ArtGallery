// backend/controllers/pinturaController.js
const db = require('../config/db');

const getPinturasPorCategoria = async (req, res) => {
    const { categoria } = req.params;
    try {
        const result = await db.query('SELECT * FROM pinturas WHERE categoria = $1 ORDER BY fecha_creacion DESC', [categoria]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Error al obtener ${categoria}:`, err);
        res.status(500).json({ error: 'Error al obtener datos por categoría.' });
    }
};

const getPinturaById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM pinturas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pintura no encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error al obtener pintura con ID ${id}:`, err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    getPinturasPorCategoria,
    getPinturaById
};