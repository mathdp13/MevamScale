const router = require('express').Router();
const authController = require('../controllers/AuthController');

router.post('/login', (req, res) => authController.login(req, res));
router.post('/login/google', (req, res) => authController.loginGoogle(req, res));

module.exports = router;
