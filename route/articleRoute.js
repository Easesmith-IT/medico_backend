const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerConfig');
const { 
  createArticle, 
  getAllArticles, 
  getArticleById,
  getMyArticles,
  updateArticle,
  deleteArticle,
  getArticlesByDoctorId,
  publishArticle
} = require('../controller/articleController');
const { protect } = require('../middleware/auth');

const uploadMiddleware = (req, res, next) => {
  const articleType = req.body.articleType?.toLowerCase();
  
  if (articleType === 'video') {
    upload.single('video')(req, res, next);
  } else if (articleType === 'image') {
    upload.array('images', 10)(req, res, next);
  } else {
    next();
  }
};

router.post('/create', protect('doctor', 'hospital'), uploadMiddleware, createArticle);
router.get('/my-articles', protect('doctor', 'hospital'), getMyArticles);
router.put('/updateArticle/:id', protect('doctor', 'hospital'), updateArticle);
router.delete('/:id', protect('doctor', 'hospital'), deleteArticle);
router.patch('/:id/publish', protect('doctor', 'hospital'), publishArticle);
router.get('/', getAllArticles);
// PUBLIC route - no authenticate middleware
router.get('/doctors/:doctorId/articles', getArticlesByDoctorId);

router.get('/getArticleById/:id', getArticleById);

module.exports = router;
