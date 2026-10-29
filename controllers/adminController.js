const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');
const CustomOrder = require('../models/CustomOrder');
const GiftBox = require('../models/GiftBox');
const Contact = require('../models/Contact');
const Review = require('../models/Review');
const { formatKSh } = require('../utils/money');

/**
 * Render admin login page
 */
exports.getLogin = (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.render('admin/login', {
    title: 'Admin Portal Login — Yarn & Bloom',
    layout: false
  });
};

/**
 * Render the superadmin-only admin account sign-up page
 */
exports.getSignup = (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.render('admin/signup', {
    title: 'Create Admin Account — Yarn & Bloom',
    layout: false
  });
};

/**
 * Create an admin account and send the creator to sign in
 */
exports.postSignup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const passwordHash = await Admin.hashPassword(password);

    try {
      await Admin.create({ username, email, passwordHash });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'An admin account with that username or email already exists.');
        return res.redirect('/admin/signup');
      }
      throw error;
    }

    req.session.regenerate(error => {
      if (error) return next(error);

      req.flash('success', 'Admin account created. Please sign in with the new account.');
      req.session.save(saveError => {
        if (saveError) return next(saveError);
        res.redirect('/admin/login');
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process admin login
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'Please provide both username and password.');
      return res.redirect('/admin/login');
    }

    const admin = await Admin.findByUsername(username.trim());
    if (!admin) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/admin/login');
    }

    const isMatch = await Admin.verifyPassword(password, admin.password_hash);
    if (!isMatch) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/admin/login');
    }

    req.session.regenerate(error => {
      if (error) return next(error);

      req.session.adminUser = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      };

      req.flash('success', `Welcome back, ${admin.username}!`);
      req.session.save(saveError => {
        if (saveError) return next(saveError);
        res.redirect('/admin/dashboard');
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin logout
 */
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('[Admin Logout Error]:', err);
    res.redirect('/admin/login');
  });
};

/**
 * Admin Dashboard overview
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalProducts,
      categories,
      customOrders,
      giftBoxes,
      contacts,
      reviews,
      settings
    ] = await Promise.all([
      Product.countAll(),
      Category.findAll(),
      CustomOrder.findAll({ limit: 10 }),
      GiftBox.findAll({ limit: 10 }),
      Contact.findAll({ limit: 10 }),
      Review.findAll({ limit: 10 }),
      Admin.getSettings()
    ]);

    const pendingOrdersCount = customOrders.filter(o => o.status === 'pending').length;
    const unreadContactsCount = contacts.filter(c => c.status === 'unread').length;

    res.render('admin/dashboard', {
      title: 'Admin Dashboard — Yarn & Bloom',
      layout: 'admin/layout',
      activeTab: 'dashboard',
      stats: {
        totalProducts,
        totalCategories: categories.length,
        pendingOrders: pendingOrdersCount,
        unreadContacts: unreadContactsCount,
        giftBoxCount: giftBoxes.length,
        totalReviews: reviews.length
      },
      categories,
      recentCustomOrders: customOrders.slice(0, 5),
      recentContacts: contacts.slice(0, 5),
      recentGiftBoxes: giftBoxes.slice(0, 5),
      settings,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: List Products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.findAll({ limit: 100 }),
      Category.findAll()
    ]);

    res.render('admin/products', {
      title: 'Product Management — Yarn & Bloom Admin',
      layout: 'admin/layout',
      activeTab: 'products',
      products,
      categories,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: Render Add Form
 */
exports.getAddProduct = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.render('admin/product-form', {
      title: 'Add New Crochet Product — Yarn & Bloom Admin',
      layout: 'admin/layout',
      activeTab: 'products',
      isEdit: false,
      product: {},
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: Handle Add Product
 */
exports.postAddProduct = async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      short_description,
      detailed_description,
      price,
      compare_at_price,
      stock_status,
      estimated_production_days,
      materials,
      dimensions,
      available_colors,
      occasions,
      is_customizable,
      is_featured,
      care_instructions
    } = req.body;

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(Math.random() * 1000);

    let primaryImage = '/images/products/sunday-tote.svg';
    if (req.file) {
      primaryImage = `/uploads/${req.file.filename}`;
    }

    const productId = await Product.create({
      category_id: category_id ? parseInt(category_id, 10) : null,
      name: name.trim(),
      slug,
      short_description: short_description.trim(),
      detailed_description: detailed_description.trim(),
      price: parseFloat(price),
      compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
      stock_status: stock_status || 'made_to_order',
      estimated_production_days: estimated_production_days ? parseInt(estimated_production_days, 10) : 3,
      materials: materials ? materials.trim() : '100% Cotton Yarn',
      dimensions: dimensions ? dimensions.trim() : null,
      available_colors: available_colors ? available_colors.trim() : '',
      is_customizable: Boolean(is_customizable),
      is_featured: Boolean(is_featured),
      is_active: true,
      occasions: occasions ? occasions.trim() : '',
      primary_image: primaryImage,
      care_instructions: care_instructions ? care_instructions.trim() : ''
    });

    req.flash('success', `Product "${name}" has been successfully created!`);
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: Render Edit Form
 */
exports.getEditProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [product, categories] = await Promise.all([
      Product.findById(id),
      Category.findAll()
    ]);

    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    res.render('admin/product-form', {
      title: `Edit ${product.name} — Yarn & Bloom Admin`,
      layout: 'admin/layout',
      activeTab: 'products',
      isEdit: true,
      product,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: Handle Edit Product
 */
exports.postEditProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);

    if (!existing) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    const {
      name,
      category_id,
      short_description,
      detailed_description,
      price,
      compare_at_price,
      stock_status,
      estimated_production_days,
      materials,
      dimensions,
      available_colors,
      occasions,
      is_customizable,
      is_featured,
      is_active,
      care_instructions
    } = req.body;

    let primaryImage = existing.primary_image;
    if (req.file) {
      primaryImage = `/uploads/${req.file.filename}`;
    }

    await Product.update(id, {
      category_id: category_id ? parseInt(category_id, 10) : null,
      name: name.trim(),
      slug: existing.slug,
      short_description: short_description.trim(),
      detailed_description: detailed_description.trim(),
      price: parseFloat(price),
      compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
      stock_status: stock_status || 'made_to_order',
      estimated_production_days: estimated_production_days ? parseInt(estimated_production_days, 10) : 3,
      materials: materials ? materials.trim() : '100% Cotton Yarn',
      dimensions: dimensions ? dimensions.trim() : null,
      available_colors: available_colors ? available_colors.trim() : '',
      is_customizable: Boolean(is_customizable),
      is_featured: Boolean(is_featured),
      is_active: Boolean(is_active),
      occasions: occasions ? occasions.trim() : '',
      primary_image: primaryImage,
      care_instructions: care_instructions ? care_instructions.trim() : ''
    });

    req.flash('success', `Product "${name}" updated successfully.`);
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

/**
 * Product Management: Delete Product
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.delete(id);
    req.flash('success', 'Product deleted successfully.');
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

/**
 * Enquiry Management: View All Enquiries (Custom Orders, Contacts, Gift Boxes)
 */
exports.getEnquiries = async (req, res, next) => {
  try {
    const [customOrders, giftBoxes, contacts, reviews] = await Promise.all([
      CustomOrder.findAll({ limit: 50 }),
      GiftBox.findAll({ limit: 50 }),
      Contact.findAll({ limit: 50 }),
      Review.findAll({ limit: 50 })
    ]);

    res.render('admin/enquiries', {
      title: 'Customer Enquiries & Orders — Yarn & Bloom Admin',
      layout: 'admin/layout',
      activeTab: 'enquiries',
      customOrders,
      giftBoxes,
      contacts,
      reviews,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Custom Order Status
 */
exports.updateCustomOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    await CustomOrder.updateStatus(id, status, admin_notes || null);
    req.flash('success', `Order status updated to ${status}.`);
    res.redirect('/admin/enquiries#custom-orders');
  } catch (error) {
    next(error);
  }
};

/**
 * Update Contact Enquiry Status
 */
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    await Contact.updateStatus(id, status, admin_notes || null);
    req.flash('success', `Message status updated to ${status}.`);
    res.redirect('/admin/enquiries#contact-messages');
  } catch (error) {
    next(error);
  }
};

/**
 * Moderate Review
 */
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_approved, is_featured } = req.body;
    await Review.updateStatus(id, {
      is_approved: is_approved === 'true' || is_approved === true || is_approved === '1',
      is_featured: is_featured === 'true' || is_featured === true || is_featured === '1'
    });
    req.flash('success', 'Review moderation updated.');
    res.redirect('/admin/enquiries#reviews');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Review
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Review.delete(id);
    req.flash('success', 'Review removed.');
    res.redirect('/admin/enquiries#reviews');
  } catch (error) {
    next(error);
  }
};

/**
 * Update Application Settings (WhatsApp number, hours, announcement)
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      whatsapp_number,
      business_email,
      business_phone,
      business_hours,
      business_location,
      announcement_bar
    } = req.body;

    if (whatsapp_number) await Admin.updateSetting('whatsapp_number', whatsapp_number.replace(/[^\d]/g, ''));
    if (business_email) await Admin.updateSetting('business_email', business_email.trim());
    if (business_phone) await Admin.updateSetting('business_phone', business_phone.trim());
    if (business_hours) await Admin.updateSetting('business_hours', business_hours.trim());
    if (business_location) await Admin.updateSetting('business_location', business_location.trim());
    if (announcement_bar) await Admin.updateSetting('announcement_bar', announcement_bar.trim());

    req.flash('success', 'Business settings successfully updated.');
    res.redirect('/admin/dashboard');
  } catch (error) {
    next(error);
  }
};
