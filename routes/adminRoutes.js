const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isGuest } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const {
  adminSignupValidationRules,
  productValidationRules,
  checkValidation
} = require('../middleware/validateRequest');

// Auth routes
router.get('/login', isGuest, adminController.getLogin);
router.post('/login', isGuest, adminController.postLogin);
router.get('/signup', adminController.getSignup);
router.post(
  '/signup',
  adminSignupValidationRules,
  checkValidation('/admin/signup'),
  adminController.postSignup
);
router.post('/logout', isAuthenticated, adminController.logout);

// Dashboard
router.get('/', adminController.getAdminHome);
router.get('/dashboard', isAuthenticated, adminController.getDashboard);

// Products
router.get('/products', isAuthenticated, adminController.getProducts);
router.get('/products/new', isAuthenticated, adminController.getAddProduct);
router.post(
  '/products/new',
  isAuthenticated,
  upload.fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 5 }
  ]),
  productValidationRules,
  checkValidation('/admin/products/new'),
  adminController.postAddProduct
);
router.get('/products/:id/edit', isAuthenticated, adminController.getEditProduct);
router.post(
  '/products/:id/edit',
  isAuthenticated,
  upload.fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 5 }
  ]),
  productValidationRules,
  checkValidation('back'),
  adminController.postEditProduct
);
router.post('/products/:id/delete', isAuthenticated, adminController.deleteProduct);

// Enquiries & Orders
router.get('/enquiries', isAuthenticated, adminController.getEnquiries);
router.post('/enquiries/custom-order/:id', isAuthenticated, adminController.updateCustomOrderStatus);
router.post('/enquiries/contact/:id', isAuthenticated, adminController.updateContactStatus);

// Reviews
router.post('/reviews/:id/status', isAuthenticated, adminController.updateReviewStatus);
router.post('/reviews/:id/delete', isAuthenticated, adminController.deleteReview);

// Settings
router.post('/settings', isAuthenticated, adminController.updateSettings);

module.exports = router;
