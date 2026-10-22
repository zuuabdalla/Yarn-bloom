const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const Admin = require('../models/Admin');
const WhatsAppService = require('../services/whatsappService');

router.get('/', homeController.getHome);
router.get('/bag', async (req, res, next) => {
  try {
    const settings = await Admin.getSettings();
    res.render('pages/bag', {
      title: 'Shopping Bag — Yarn & Bloom',
      activeNav: 'bag',
      businessNumber: WhatsAppService.getBusinessNumber(),
      settings
    });
  } catch (error) {
    next(error);
  }
});
router.get('/our-story', homeController.getOurStory);
router.get('/faq', homeController.getFaq);
router.post('/newsletter', homeController.subscribeNewsletter);

module.exports = router;
