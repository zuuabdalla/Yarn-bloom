const express = require('express');
const router = express.Router();
const giftFinderController = require('../controllers/giftFinderController');

router.get('/gift-finder', giftFinderController.getGiftFinderPage);
router.post('/gift-finder', giftFinderController.getRecommendations);

module.exports = router;
