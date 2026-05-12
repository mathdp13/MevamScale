const router = require('express').Router();

router.use(require('./auth.routes'));
router.use(require('./usuarios.routes'));
router.use(require('./ministerios.routes'));
router.use(require('./escalas.routes'));
router.use(require('./slides.routes'));
router.use(require('./eventos-fixos.routes'));
router.use(require('./biblia.routes'));
router.use(require('./cifra.routes'));

module.exports = router;
