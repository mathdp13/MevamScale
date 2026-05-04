const router = require('express').Router();
const usuariosController = require('../controllers/UsuariosController');

// Rota específica antes da parametrizada para evitar conflito de matching
router.post('/usuarios/skills', (req, res) => usuariosController.atualizarSkills(req, res));
router.post('/usuarios', (req, res) => usuariosController.criar(req, res));
router.get('/usuarios/:id', (req, res) => usuariosController.buscar(req, res));
router.put('/usuarios/:id', (req, res) => usuariosController.atualizar(req, res));
router.get('/usuarios/:id/ministerios', (req, res) => usuariosController.buscarMinisterios(req, res));

module.exports = router;
