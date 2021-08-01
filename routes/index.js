const {Router} = require('express');
const { getIndex, getSinglePost, getContactPage, getCaptcha, handleContactPage, handleSearch } = require('../controllers/indexController');

const router = new Router()

router.get('/', getIndex)

router.get('/post/:id', getSinglePost)


router.get("/contact", getContactPage);

router.get("/captcha.png", getCaptcha);

router.post("/contact", handleContactPage);

router.post("/search", handleSearch);

module.exports = router