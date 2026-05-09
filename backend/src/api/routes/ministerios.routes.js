const router = require('express').Router();
const ministeriosController = require('../controllers/MinisteriosController');

router.post('/ministerios/entrar', (req, res) => ministeriosController.entrar(req, res));
router.post('/ministerios', (req, res) => ministeriosController.criar(req, res));
router.get('/ministerios/:id', (req, res) => ministeriosController.buscar(req, res));
router.get('/ministerios/:id/membros', (req, res) => ministeriosController.buscarMembros(req, res));
router.get('/ministerios/:id/funcoes', (req, res) => ministeriosController.listarFuncoes(req, res));
router.post('/ministerios/:id/funcoes', (req, res) => ministeriosController.criarFuncao(req, res));
router.put('/ministerios/:id/funcoes/:funcaoId', (req, res) => ministeriosController.atualizarFuncao(req, res));
router.delete('/ministerios/:id/funcoes/:funcaoId', (req, res) => ministeriosController.deletarFuncao(req, res));
router.post('/ministerios/:id/membro-funcoes', (req, res) => ministeriosController.salvarFuncoesMembro(req, res));
router.put('/ministerios/:id', (req, res) => ministeriosController.atualizar(req, res));
router.delete('/ministerios/:id', (req, res) => ministeriosController.deletar(req, res));

module.exports = router;
