const router = require('express').Router();

router.use(require('./auth.routes'));
router.use(require('./usuarios.routes'));
router.use(require('./ministerios.routes'));

module.exports = router;
