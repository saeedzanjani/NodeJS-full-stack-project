const {Router} = require('express');

const {dashboard, getAddPost, createPost, uploadImage, editPost, getEditPost, deletePost, handleDashSearch} = require('../controllers/dashboardController');
const {authenticated} = require('../middlewares/auth');

const router = new Router()

router.get('/', authenticated, dashboard)

router.get('/add-post', authenticated, getAddPost)
router.post('/add-post', authenticated, createPost)

router.post('/image-upload', authenticated, uploadImage)

router.get('/edit-post/:id', authenticated, getEditPost)
router.post('/edit-post/:id', authenticated, editPost)

router.get('/delete-post/:id', authenticated, deletePost)

router.post('/search', authenticated, handleDashSearch)

module.exports = router