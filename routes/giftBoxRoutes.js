const express = require('express');
const router = express.Router();
const giftBoxController = require('../controllers/giftBoxController');

router.get('/gift-box', giftBoxController.getGiftBoxPage);
router.post('/gift-box/ai-suggest', giftBoxController.getGiftBoxSuggestions);
router.post('/gift-box', giftBoxController.submitGiftBoxOrder);

module.exports = router;
