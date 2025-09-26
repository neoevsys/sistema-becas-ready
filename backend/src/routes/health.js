const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

// GET /health - Verificar salud del sistema
router.get('/', getHealth);

module.exports = router;
