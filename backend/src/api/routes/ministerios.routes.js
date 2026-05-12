const router = require('express').Router();
const ministeriosController = require('../controllers/MinisteriosController');
const escalasController = require('../controllers/EscalasController');

router.get('/ministerios', (req, res) => ministeriosController.listarTodos(req, res));
router.post('/ministerios/entrar', (req, res) => ministeriosController.entrar(req, res));
router.post('/ministerios', (req, res) => ministeriosController.criar(req, res));
router.get('/ministerios/:id', (req, res) => ministeriosController.buscar(req, res));
router.get('/ministerios/:id/membros', (req, res) => ministeriosController.buscarMembros(req, res));
router.get('/ministerios/:id/funcoes', (req, res) => ministeriosController.listarFuncoes(req, res));
router.post('/ministerios/:id/funcoes', (req, res) => ministeriosController.criarFuncao(req, res));
router.put('/ministerios/:id/funcoes/:funcaoId', (req, res) => ministeriosController.atualizarFuncao(req, res));
router.delete('/ministerios/:id/funcoes/:funcaoId', (req, res) => ministeriosController.deletarFuncao(req, res));
router.post('/ministerios/:id/membro-funcoes', (req, res) => ministeriosController.salvarFuncoesMembro(req, res));
router.get('/ministerios/:id/escala-config', (req, res) => ministeriosController.getEscalaConfig(req, res));
router.put('/ministerios/:id/escala-config', (req, res) => ministeriosController.setEscalaConfig(req, res));
router.get('/ministerios/:id/stats', (req, res) => escalasController.stats(req, res));
router.patch('/ministerios/:id/config', (req, res) => ministeriosController.atualizarConfig(req, res));
router.put('/ministerios/:id', (req, res) => ministeriosController.atualizar(req, res));
router.delete('/ministerios/:id', (req, res) => ministeriosController.deletar(req, res));

router.get('/ministerios/:id/musicas', (req, res) => ministeriosController.listarMusicas(req, res));
router.post('/ministerios/:id/musicas', (req, res) => ministeriosController.criarMusica(req, res));
router.put('/ministerios/:id/musicas/:musicaId', (req, res) => ministeriosController.atualizarMusica(req, res));
router.delete('/ministerios/:id/musicas/:musicaId', (req, res) => ministeriosController.deletarMusica(req, res));

module.exports = router;
