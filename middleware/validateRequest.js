const { body, validationResult } = require('express-validator');

/**
 * Custom order form validation rules
 */
const customOrderValidationRules = [
  body('customer_name')
    .trim()
    .notEmpty().withMessage('Please provide your name.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('whatsapp_number')
    .trim()
    .notEmpty().withMessage('Please provide your WhatsApp phone number.')
    .matches(/^[\d\s+\-()]{9,20}$/).withMessage('Please enter a valid WhatsApp phone number.'),
  body('design_description')
    .trim()
    .notEmpty().withMessage('Please describe the crochet item you would like created.')
    .isLength({ min: 10 }).withMessage('Design description should be at least 10 characters so we can understand your vision.'),
  body('budget')
    .optional({ checkFalsy: true })
    .isNumeric().withMessage('Budget must be a valid number in Kenyan Shillings.')
];

/**
 * Contact form validation rules
 */
const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Please provide your name.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Please provide your email address.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty().withMessage('Please provide a subject.'),
  body('message')
    .trim()
    .notEmpty().withMessage('Please provide your message.')
    .isLength({ min: 5 }).withMessage('Message must be at least 5 characters long.')
];

/**
 * Product management validation rules
 */
const productValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required.')
    .isLength({ max: 150 }).withMessage('Product name cannot exceed 150 characters.'),
  body('price')
    .notEmpty().withMessage('Product price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number in KSh.'),
  body('short_description')
    .trim()
    .notEmpty().withMessage('Short description is required.')
    .isLength({ max: 255 }).withMessage('Short description cannot exceed 255 characters.'),
  body('detailed_description')
    .trim()
    .notEmpty().withMessage('Detailed description is required.')
];

/**
 * Generic middleware to catch validation errors and redirect with flash messages
 */
function checkValidation(redirectUrl = 'back') {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(e => e.msg);
      if (req.flash) {
        req.flash('error', errorMessages.join(' '));
        // Save form values in session for repopulating
        req.session.formData = req.body;
      }
      return res.redirect(redirectUrl);
    }
    next();
  };
}

module.exports = {
  customOrderValidationRules,
  contactValidationRules,
  productValidationRules,
  checkValidation
};
