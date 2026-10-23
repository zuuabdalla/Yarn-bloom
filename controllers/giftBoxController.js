const Product = require('../models/Product');
const GiftBox = require('../models/GiftBox');
const Admin = require('../models/Admin');
const AiGiftService = require('../services/aiGiftService');
const WhatsAppService = require('../services/whatsappService');
const { generateReferenceNumber, sanitizeWhatsAppNumber } = require('../utils/validation');
const { formatKSh } = require('../utils/money');

// Gift packaging and card standard options with verified server prices
const PACKAGING_OPTIONS = [
  {
    id: 'pkg-standard',
    name: 'Artisan Kraft Gift Box & Ribbon',
    price: 350.00,
    description: 'Eco-friendly rigid kraft box with cotton ribbon and botanical tissue'
  },
  {
    id: 'pkg-luxury',
    name: 'Luxury Sage Keepsake Box & Wax Seal',
    price: 650.00,
    description: 'Embossed hardboard box with sage satin ribbon and botanical wax seal'
  }
];

const CARD_OPTIONS = [
  {
    id: 'card-handwritten',
    name: 'Handwritten Calligraphy Message Card',
    price: 150.00,
    description: 'Heavyweight textured card with your personalized message written in ink'
  }
];

exports.getGiftBoxPage = async (req, res, next) => {
  try {
    await renderGiftBoxPage(res);
  } catch (error) {
    next(error);
  }
};

exports.getGiftBoxSuggestions = async (req, res, next) => {
  try {
    const answers = {
      recipient: req.body.recipient_name,
      occasion: req.body.occasion,
      budget: req.body.max_budget,
      colors: req.body.color_theme,
      preference: req.body.gift_style
    };
    const products = await Product.findForGiftBox();
    const suggestion = await AiGiftService.getGiftBoxRecommendations(products, answers);
    await renderGiftBoxPage(res, {
      answers,
      suggestion,
      products,
      selectedProductIds: suggestion.recommendations.map(product => String(product.id))
    });
  } catch (error) {
    next(error);
  }
};

exports.submitGiftBoxOrder = async (req, res, next) => {
  try {
    const {
      customer_name,
      whatsapp_number,
      color_theme,
      recipient_name,
      gift_message,
      occasion,
      max_budget,
      selected_product_ids,
      packaging_id,
      card_id
    } = req.body;

    // Parse product IDs sent by client
    let productIds = [];
    if (Array.isArray(selected_product_ids)) {
      productIds = selected_product_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    } else if (typeof selected_product_ids === 'string' && selected_product_ids.trim()) {
      try {
        const parsed = JSON.parse(selected_product_ids);
        if (Array.isArray(parsed)) productIds = parsed.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      } catch (e) {
        productIds = selected_product_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }
    }

    // Must have at least one product
    if (productIds.length === 0) {
      req.flash('error', 'Please select at least one crochet item to include in your gift box.');
      return res.redirect('/gift-box');
    }

    if (!whatsapp_number || !whatsapp_number.trim()) {
      req.flash('error', 'Please provide a valid WhatsApp phone number so we can confirm your gift box.');
      return res.redirect('/gift-box');
    }

    // RECALCULATE TRUSTED SERVER-SIDE TOTALS USING DATABASE PRICES
    const verifiedItems = [];
    let calculatedTotal = 0;

    for (const id of productIds) {
      const prod = await Product.findById(id);
      if (prod && prod.is_active) {
        const priceNum = parseFloat(prod.price);
        calculatedTotal += priceNum;
        verifiedItems.push({
          id: prod.id,
          name: prod.name,
          category: prod.category_name || 'Handmade Crochet',
          price: priceNum,
          type: 'product'
        });
      }
    }

    if (verifiedItems.length === 0) {
      req.flash('error', 'The selected items are currently unavailable.');
      return res.redirect('/gift-box');
    }

    // Add selected packaging
    const packaging = PACKAGING_OPTIONS.find(p => p.id === packaging_id) || PACKAGING_OPTIONS[0];
    calculatedTotal += packaging.price;
    verifiedItems.push({
      id: packaging.id,
      name: packaging.name,
      price: packaging.price,
      type: 'packaging'
    });

    // Add card if selected or gift message provided
    if (gift_message && gift_message.trim()) {
      const card = CARD_OPTIONS.find(c => c.id === card_id) || CARD_OPTIONS[0];
      calculatedTotal += card.price;
      verifiedItems.push({
        id: card.id,
        name: card.name,
        price: card.price,
        type: 'card'
      });
    }

    const budget = max_budget ? Number(max_budget) : null;
    if (max_budget && (!Number.isFinite(budget) || budget <= 0)) {
      req.flash('error', 'Please enter a valid gift box budget.');
      return res.redirect('/gift-box');
    }
    if (budget !== null && calculatedTotal > budget) {
      req.flash('error', 'Your selected items and extras exceed your budget. Please remove an item or increase your budget.');
      return res.redirect('/gift-box');
    }

    const referenceNumber = generateReferenceNumber('GIFT');
    const sanitizedPhone = sanitizeWhatsAppNumber(whatsapp_number);

    await GiftBox.create({
      reference_number: referenceNumber,
      customer_name: customer_name ? customer_name.trim() : 'Valued Customer',
      whatsapp_number: sanitizedPhone || whatsapp_number.trim(),
      color_theme: color_theme || 'Sage Meadow (Sage & Cream)',
      recipient_name: recipient_name ? recipient_name.trim() : null,
      gift_message: gift_message ? gift_message.trim() : null,
      occasion: occasion || 'Celebration',
      max_budget: budget,
      estimated_total: calculatedTotal,
      selected_items: verifiedItems
    });

    // Build the WhatsApp order message
    const whatsappData = WhatsAppService.buildGiftBoxMessage({
      referenceNumber,
      customerName: customer_name,
      colorTheme: color_theme || 'Sage Meadow',
      recipientName: recipient_name,
      giftMessage: gift_message,
      occasion,
      maxBudget: budget,
      estimatedTotal: calculatedTotal,
      selectedItems: verifiedItems
    });

    res.render('pages/gift-box-confirmation', {
      title: 'Gift Box Created — Yarn & Bloom',
      activeNav: 'gift-box',
      referenceNumber,
      customerName: customer_name,
      colorTheme: color_theme || 'Sage Meadow',
      recipientName: recipient_name,
      giftMessage: gift_message,
      occasion,
      maxBudget: budget,
      estimatedTotal: calculatedTotal,
      selectedItems: verifiedItems,
      whatsappUrl: whatsappData.url,
      whatsappMessageText: whatsappData.text,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};

async function renderGiftBoxPage(res, {
  answers = {},
  suggestion = null,
  products: providedProducts,
  selectedProductIds = []
} = {}) {
  const [products, settings] = await Promise.all([
    providedProducts ? Promise.resolve(providedProducts) : Product.findForGiftBox(),
    Admin.getSettings()
  ]);

  const bagItems = products.filter(p => (p.category_slug || '').includes('bag') || p.name.toLowerCase().includes('tote') || p.name.toLowerCase().includes('pouch'));
  const flowerItems = products.filter(p => (p.category_slug || '').includes('flower') || p.name.toLowerCase().includes('bloom') || p.name.toLowerCase().includes('daisy'));
  const toyItems = products.filter(p => (p.category_slug || '').includes('toy') || p.name.toLowerCase().includes('bear') || p.name.toLowerCase().includes('bunny'));
  const otherItems = products.filter(p => !bagItems.includes(p) && !flowerItems.includes(p) && !toyItems.includes(p));

  res.render('pages/gift-box', {
    title: 'Create Your Own Crochet Gift Box — Yarn & Bloom',
    activeNav: 'gift-box',
    bagItems,
    flowerItems,
    toyItems,
    otherItems,
    packagingOptions: PACKAGING_OPTIONS,
    cardOptions: CARD_OPTIONS,
    settings,
    answers,
    suggestion,
    selectedProductIds,
    formatKSh
  });
}
