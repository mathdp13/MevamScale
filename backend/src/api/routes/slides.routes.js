const router = require('express').Router();
const { controller, upload } = require('../controllers/SlidesController');
const { autenticarToken } = require('../middleware/auth.middleware');

router.get('/slides-login', (req, res) => controller.listar(req, res));
router.get('/slides-login/admin', autenticarToken, (req, res) => controller.listarAdmin(req, res));
router.post('/slides-login', autenticarToken, upload.single('imagem'), (req, res) => controller.criar(req, res));
router.patch('/slides-login/:id/toggle', autenticarToken, (req, res) => controller.toggleAtivo(req, res));
router.delete('/slides-login/:id', autenticarToken, (req, res) => controller.deletar(req, res));

module.exports = router;
