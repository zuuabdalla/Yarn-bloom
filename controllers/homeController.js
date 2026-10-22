const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const { formatKSh } = require('../utils/money');

exports.getHome = async (req, res, next) => {
  try {
    const [featuredProducts, categories, testimonials, settings] = await Promise.all([
      Product.findFeatured(6),
      Category.findAll(),
      Review.findFeatured(3),
      Admin.getSettings()
    ]);

    res.render('pages/home', {
      title: 'Yarn & Bloom — Handmade Crochet Bags, Flowers & Personalised Gifts',
      activeNav: 'home',
      featuredProducts,
      categories,
      testimonials,
      settings,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};

exports.getOurStory = async (req, res, next) => {
  try {
    const settings = await Admin.getSettings();
    res.render('pages/our-story', {
      title: 'Our Story — Yarn & Bloom',
      activeNav: 'our-story',
      settings
    });
  } catch (error) {
    next(error);
  }
};

exports.getFaq = async (req, res, next) => {
  try {
    const settings = await Admin.getSettings();
    res.render('pages/faq', {
      title: 'Frequently Asked Questions — Yarn & Bloom',
      activeNav: 'faq',
      settings
    });
  } catch (error) {
    next(error);
  }
};

exports.subscribeNewsletter = (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    req.flash('error', 'Please enter a valid email address to subscribe.');
  } else {
    req.flash('success', 'Thank you for joining our community! You will receive our latest handmade designs and craft stories.');
  }
  res.redirect('back');
};
