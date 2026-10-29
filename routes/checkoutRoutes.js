const express = require('express');
const checkoutController = require('../controllers/checkoutController');

const router = express.Router();

router.get('/checkout', checkoutController.getCheckout);
router.post('/checkout/quote', checkoutController.quoteCart);
router.post('/checkout', checkoutController.createOrder);
router.get('/checkout/confirmation/:referenceNumber', checkoutController.getConfirmation);

module.exports = router;
