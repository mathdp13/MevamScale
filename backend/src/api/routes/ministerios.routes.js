const router = require('express').Router();
const ministeriosController = require('../controllers/MinisteriosController');

// Rota específica antes da parametrizada
router.post('/ministerios/entrar', (req, res) => ministeriosController.entrar(req, res));
router.post('/ministerios', (req, res) => ministeriosController.criar(req, res));
router.get('/ministerios/:id/membros', (req, res) => ministeriosController.buscarMembros(req, res));

module.exports = router;
