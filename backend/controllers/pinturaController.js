// backend/controllers/pinturaController.js
const db = require('../config/db');

const CATEGORIA_VALIDA = /^[a-z0-9-]{1,50}$/i;

const getPinturasPorCategoria = async (req, res, next) => {
    const { categoria } = req.params;

    if (!CATEGORIA_VALIDA.test(categoria)) {
        return res.status(400).json({ error: 'Categoría inválida.' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM pinturas WHERE categoria = $1 ORDER BY fecha_creacion DESC',
            [categoria]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const getPinturaById = async (req, res, next) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero.' });
    }

    const numericId = parseInt(id, 10);
    if (numericId < 1 || numericId > 2147483647) {
        return res.status(400).json({ error: 'ID fuera de rango.' });
    }

    try {
        const result = await db.query('SELECT * FROM pinturas WHERE id = $1', [numericId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pintura no encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPinturasPorCategoria,
    getPinturaById
};
