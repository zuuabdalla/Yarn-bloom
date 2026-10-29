const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const WhatsAppService = require('../services/whatsappService');
const { formatKSh, calculateDiscount } = require('../utils/money');

exports.getShop = async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : null;
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
    const requestedPage = Number.parseInt(req.query.page, 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    const [categories, products, totalProducts, settings] = await Promise.all([
      Category.findAll(),
      Product.findAll({
        categorySlug: category,
        search,
        sortBy: sort,
        limit,
        offset
      }),
      Product.countAll({
        categorySlug: category,
        search
      }),
      Admin.getSettings()
    ]);

    const totalPages = Math.ceil(totalProducts / limit);
    const activeCategory = category ? categories.find(c => c.slug === category) : null;

    res.render('pages/shop', {
      title: activeCategory ? `${activeCategory.name} — Yarn & Bloom` : 'Shop All Handmade Crochet — Yarn & Bloom',
      activeNav: 'shop',
      categories,
      products,
      totalProducts,
      currentPage: page,
      totalPages,
      selectedCategory: category || 'all',
      activeCategory,
      searchQuery: search,
      sortBy: sort,
      settings,
      formatKSh,
      calculateDiscount,
      WhatsAppService
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findBySlug(slug);

    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Product Not Found — Yarn & Bloom',
        pageUrl: req.originalUrl,
        activeNav: 'shop'
      });
    }

    const [images, relatedProducts, reviews, settings] = await Promise.all([
      Product.getImages(product.id),
      Product.findRelated(product.category_id, product.id, 4),
      Review.findByProduct(product.id),
      Admin.getSettings()
    ]);

    // Parse available colors
    const colorsList = product.available_colors
      ? product.available_colors.split(',').map(c => c.trim()).filter(Boolean)
      : ['Natural Cream', 'Sage Green', 'Warm Honey'];

    // Default WhatsApp message URL
    const defaultWhatsApp = WhatsAppService.buildProductOrderMessage({
      productName: product.name,
      productPrice: product.price,
      quantity: 1,
      selectedColor: colorsList[0] || 'As pictured'
    });

    res.render('pages/product-details', {
      title: `${product.name} — Yarn & Bloom`,
      activeNav: 'shop',
      product,
      images,
      colorsList,
      relatedProducts,
      reviews,
      settings,
      formatKSh,
      calculateDiscount,
      defaultWhatsAppUrl: defaultWhatsApp.url,
      businessNumber: WhatsAppService.getBusinessNumber()
    });
  } catch (error) {
    next(error);
  }
};

exports.postReview = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { customer_name, rating, comment } = req.body;

    const product = await Product.findBySlug(slug);
    if (!product) {
      return res.redirect('/shop');
    }

    if (!customer_name || !comment) {
      req.flash('error', 'Please provide your name and your review feedback.');
      return res.redirect(`/shop/${slug}`);
    }

    await Review.create({
      product_id: product.id,
      customer_name: customer_name.trim(),
      rating: parseInt(rating, 10) || 5,
      comment: comment.trim()
    });

    req.flash('success', 'Thank you for your review! Your kind words mean the world to our small studio.');
    res.redirect(`/shop/${slug}#reviews`);
  } catch (error) {
    next(error);
  }
};
