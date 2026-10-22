const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactValidationRules, checkValidation } = require('../middleware/validateRequest');

router.get('/contact', contactController.getContactPage);
router.post('/contact', contactValidationRules, checkValidation('/contact'), contactController.submitContact);

module.exports = router;
