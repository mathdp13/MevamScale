const router = require('express').Router();
const usuariosController = require('../controllers/UsuariosController');
const { autenticarToken } = require('../middleware/auth.middleware');

// Rotas específicas antes das parametrizadas
router.post('/usuarios/skills', (req, res) => usuariosController.atualizarSkills(req, res));
router.get('/usuarios/todos', autenticarToken, (req, res) => usuariosController.listarTodos(req, res));
router.post('/usuarios', (req, res) => usuariosController.criar(req, res));
router.get('/usuarios/:id', (req, res) => usuariosController.buscar(req, res));
router.put('/usuarios/:id/permissoes', autenticarToken, (req, res) => usuariosController.atualizarPermissoes(req, res));
router.put('/usuarios/:id', (req, res) => usuariosController.atualizar(req, res));
router.get('/usuarios/:id/ministerios', (req, res) => usuariosController.buscarMinisterios(req, res));

module.exports = router;
