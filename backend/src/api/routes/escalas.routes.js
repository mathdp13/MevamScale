const router = require('express').Router();
const ctrl = require('../controllers/EscalasController');

// Tipos de culto (por ministerio)
router.get('/ministerios/:ministerioId/tipos-culto', (req, res) => ctrl.listarTiposCulto(req, res));
router.post('/ministerios/:ministerioId/tipos-culto', (req, res) => ctrl.criarTipoCulto(req, res));
router.delete('/ministerios/:ministerioId/tipos-culto/:tipoCultoId', (req, res) => ctrl.deletarTipoCulto(req, res));

// Agenda pessoal
router.get('/agenda', (req, res) => ctrl.agenda(req, res));
router.get('/agenda/geral', (req, res) => ctrl.agendaGeral(req, res));

// Escalas
router.get('/escalas', (req, res) => ctrl.listar(req, res));
router.post('/escalas', (req, res) => ctrl.criar(req, res));
router.post('/escalas/gerar-mes', (req, res) => ctrl.gerarMes(req, res));
router.delete('/escalas/:escalaId', (req, res) => ctrl.deletar(req, res));

// Membros da escala
router.get('/escalas/:escalaId/membros', (req, res) => ctrl.listarMembros(req, res));
router.post('/escalas/:escalaId/membros', (req, res) => ctrl.adicionarMembro(req, res));
router.delete('/escalas/:escalaId/membros/:usuarioId', (req, res) => ctrl.removerMembro(req, res));
router.put('/escalas/:escalaId/membros/:usuarioId/confirmar', (req, res) => ctrl.confirmarPresenca(req, res));

module.exports = router;
