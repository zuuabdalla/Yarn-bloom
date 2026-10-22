const CustomOrder = require('../models/CustomOrder');
const Category = require('../models/Category');
const Admin = require('../models/Admin');
const WhatsAppService = require('../services/whatsappService');
const { generateReferenceNumber, sanitizeWhatsAppNumber } = require('../utils/validation');
const { formatKSh } = require('../utils/money');

exports.getCustomOrderPage = async (req, res, next) => {
  try {
    const [categories, settings] = await Promise.all([
      Category.findAll(),
      Admin.getSettings()
    ]);

    const formData = req.session.formData || {};
    delete req.session.formData;

    res.render('pages/custom-order', {
      title: 'Custom Crochet Orders — Yarn & Bloom',
      activeNav: 'custom-order',
      categories,
      settings,
      formData
    });
  } catch (error) {
    next(error);
  }
};

exports.submitCustomOrder = async (req, res, next) => {
  try {
    const {
      customer_name,
      whatsapp_number,
      category_id,
      preferred_colors,
      desired_size,
      design_description,
      occasion,
      budget,
      required_date,
      additional_instructions
    } = req.body;

    const referenceNumber = generateReferenceNumber('CUST');
    const sanitizedPhone = sanitizeWhatsAppNumber(whatsapp_number);
    let referenceImageUrl = null;

    if (req.file) {
      referenceImageUrl = `/uploads/${req.file.filename}`;
    }

    // Retrieve category name for WhatsApp message if provided
    let categoryName = 'Custom Crochet Design';
    if (category_id) {
      const cat = await Category.findById(category_id);
      if (cat) categoryName = cat.name;
    }

    await CustomOrder.create({
      reference_number: referenceNumber,
      customer_name: customer_name.trim(),
      whatsapp_number: sanitizedPhone || whatsapp_number.trim(),
      category_id: category_id || null,
      preferred_colors: preferred_colors ? preferred_colors.trim() : null,
      desired_size: desired_size ? desired_size.trim() : null,
      design_description: design_description.trim(),
      occasion: occasion ? occasion.trim() : null,
      budget: budget ? parseFloat(budget) : null,
      required_date: required_date || null,
      reference_image_url: referenceImageUrl,
      additional_instructions: additional_instructions ? additional_instructions.trim() : null
    });

    // Store reference in session to display confirmation page
    req.session.lastCustomOrderRef = referenceNumber;
    res.redirect(`/custom-order/confirmation/${referenceNumber}`);
  } catch (error) {
    next(error);
  }
};

exports.getConfirmation = async (req, res, next) => {
  try {
    const { referenceNumber } = req.params;
    const [order, settings] = await Promise.all([
      CustomOrder.findByReference(referenceNumber),
      Admin.getSettings()
    ]);

    if (!order) {
      req.flash('error', 'Enquiry reference not found.');
      return res.redirect('/custom-order');
    }

    // Build the WhatsApp URL
    const whatsappData = WhatsAppService.buildCustomOrderMessage({
      referenceNumber: order.reference_number,
      customerName: order.customer_name,
      categoryName: order.category_name || 'Bespoke Crochet Design',
      preferredColors: order.preferred_colors,
      desiredSize: order.desired_size,
      design_description: order.design_description,
      occasion: order.occasion,
      budget: order.budget,
      requiredDate: order.required_date ? new Date(order.required_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : null,
      additionalInstructions: order.additional_instructions
    });

    res.render('pages/custom-order-confirmation', {
      title: 'Enquiry Received — Yarn & Bloom',
      activeNav: 'custom-order',
      order,
      whatsappUrl: whatsappData.url,
      whatsappMessageText: whatsappData.text,
      settings,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};
