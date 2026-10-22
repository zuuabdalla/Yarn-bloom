const express = require('express');
const router = express.Router();
const customOrderController = require('../controllers/customOrderController');
const upload = require('../config/upload');
const { customOrderValidationRules, checkValidation } = require('../middleware/validateRequest');

router.get('/custom-order', customOrderController.getCustomOrderPage);

router.post(
  '/custom-order',
  upload.single('reference_image'),
  customOrderValidationRules,
  checkValidation('/custom-order'),
  customOrderController.submitCustomOrder
);

router.get('/custom-order/confirmation/:referenceNumber', customOrderController.getConfirmation);

module.exports = router;
