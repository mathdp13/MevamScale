const router = require('express').Router();
const multer = require('multer');
const { controller } = require('../controllers/EventosFixosController');
const { autenticarToken } = require('../middleware/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/eventos-fixos', (req, res) => controller.listar(req, res));
router.get('/eventos-fixos/admin', autenticarToken, (req, res) => controller.listarAdmin(req, res));
router.post('/eventos-fixos', autenticarToken, upload.single('imagem'), (req, res) => controller.criar(req, res));
router.patch('/eventos-fixos/:id/toggle', autenticarToken, (req, res) => controller.toggleAtivo(req, res));
router.delete('/eventos-fixos/:id', autenticarToken, (req, res) => controller.deletar(req, res));

module.exports = router;
