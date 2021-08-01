const { Router } = require("express");

const { register, login, registerHandler, loginHandler, logout,
     remember, handleForgetPassword, forgetPassword,
     handleResetPassword, resetPassword } = require("../controllers/userController");
const {authenticated} = require('../middlewares/auth');

const router = new Router();

router.get("/register", register);
router.post("/register", registerHandler);

router.get("/login", login);
router.post("/login", loginHandler, remember);

router.get('/logout', authenticated, logout)

router.get('/forget-password', forgetPassword)
router.post('/forget-password', handleForgetPassword)

router.get('/reset-password/:token', resetPassword)
router.post('/reset-password/:id', handleResetPassword)

module.exports = router;
