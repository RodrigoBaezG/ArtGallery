// backend/routes/pinturaRoutes.js
const express = require('express');
const router = express.Router();
const pinturaController = require('../controllers/pinturaController');

router.get('/categoria/:categoria', pinturaController.getPinturasPorCategoria);
router.get('/pintura/:id', pinturaController.getPinturaById);

module.exports = router;