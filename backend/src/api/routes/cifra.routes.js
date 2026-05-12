const router = require('express').Router();
const ctrl = require('../controllers/CifraController');

router.get('/buscar-cifra', (req, res) => ctrl.buscar(req, res));

module.exports = router;
