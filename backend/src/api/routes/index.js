const router = require('express').Router();

router.use(require('./auth.routes'));
router.use(require('./usuarios.routes'));
router.use(require('./ministerios.routes'));
router.use(require('./escalas.routes'));

module.exports = router;
