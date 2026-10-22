const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/shop', productController.getShop);
router.get('/shop/:slug', productController.getProductDetails);
router.post('/shop/:slug/review', productController.postReview);

module.exports = router;
