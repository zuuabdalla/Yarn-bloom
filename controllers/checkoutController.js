const { randomBytes } = require('crypto');
const Product = require('../models/Product');
const StoreOrder = require('../models/StoreOrder');
const WhatsAppService = require('../services/whatsappService');
const { formatKSh } = require('../utils/money');

const DELIVERY_FEE = Number(process.env.DELIVERY_FEE_KSH || 0);

function parseCart(rawCart) {
  let items = rawCart;
  if (typeof rawCart === 'string') {
    try {
      items = JSON.parse(rawCart);
    } catch {
      return { error: 'Your shopping bag could not be read. Please review it and try again.' };
    }
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return { error: 'Add between 1 and 30 products to your bag before checkout.' };
  }

  const seenItems = new Set();
  const normalizedItems = [];
  for (const item of items) {
    const id = Number(item && item.productId);
    const quantity = Number(item && item.quantity);
    const color = typeof (item && item.color) === 'string' ? item.color.trim() : '';
    const customization = typeof (item && item.customization) === 'string'
      ? item.customization.trim()
      : '';
    const key = `${id}:${color.toLowerCase()}`;

    if (!Number.isSafeInteger(id) || id < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 ||
        color.length > 120 || customization.length > 500) {
      return { error: 'A product, colour, or quantity in your bag is invalid. Please review your selections.' };
    }
    if (seenItems.has(key)) {
      return { error: 'Your bag contains duplicate product selections. Please remove duplicates and try again.' };
    }

    seenItems.add(key);
    normalizedItems.push({ id, quantity, color, customization });
  }

  return { items: normalizedItems };
}

async function priceCart(rawCart) {
  const parsed = parseCart(rawCart);
  if (parsed.error) return parsed;
  const products = await Product.findActiveByIds([...new Set(parsed.items.map(item => item.id))]);
  const productById = new Map(products.map(product => [Number(product.id), product]));
  const pricedItems = [];

  for (const selection of parsed.items) {
    const product = productById.get(selection.id);
    if (!product || product.stock_status === 'out_of_stock') {
      return { error: 'One or more products in your bag are unavailable. Please return to the shop and update your bag.' };
    }

    const availableColors = typeof product.available_colors === 'string' && product.available_colors.trim()
      ? product.available_colors.split(',').map(color => color.trim()).filter(Boolean)
      : ['Natural Cream', 'Sage Green', 'Warm Honey', 'As pictured'];
    const color = selection.color || availableColors[0] || 'As pictured';
    if (availableColors.length && !availableColors.some(item => item.toLowerCase() === color.toLowerCase())) {
      return { error: `${product.name} is not available in the selected colour. Please update your bag.` };
    }
    if (!product.is_customizable && selection.customization) {
      return { error: `${product.name} is not available for personalisation.` };
    }

    const unitPriceCents = Math.round(Number(product.price) * 100);
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new Error(`Product ${product.id} has an invalid catalog price.`);
    }

    pricedItems.push({
      id: Number(product.id),
      name: product.name,
      slug: product.slug,
      quantity: selection.quantity,
      color,
      customization: selection.customization,
      unit_price: unitPriceCents / 100,
      line_total: unitPriceCents * selection.quantity / 100,
      stock_status: product.stock_status,
      estimated_production_days: product.estimated_production_days
    });
  }

  const subtotalCents = pricedItems.reduce((sum, item) => sum + Math.round(item.line_total * 100), 0);
  const deliveryFeeCents = Math.round(DELIVERY_FEE * 100);
  if (!Number.isSafeInteger(deliveryFeeCents) || deliveryFeeCents < 0) {
    throw new Error('DELIVERY_FEE_KSH must be a non-negative amount.');
  }

  return {
    items: pricedItems,
    subtotal: subtotalCents / 100,
    delivery_fee: deliveryFeeCents / 100,
    total: (subtotalCents + deliveryFeeCents) / 100
  };
}

function validateCustomer(body) {
  const customerName = typeof body.customer_name === 'string' ? body.customer_name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const deliveryLocation = typeof body.delivery_location === 'string' ? body.delivery_location.trim() : '';
  const giftMessage = typeof body.gift_message === 'string' ? body.gift_message.trim() : '';

  if (customerName.length < 2 || customerName.length > 120) {
    return { error: 'Enter your name (2 to 120 characters).' };
  }
  if (!/^[\d\s()+-]{9,20}$/.test(phone) || phone.replace(/\D/g, '').length < 9) {
    return { error: 'Enter a valid phone number so we can confirm your order.' };
  }
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: 'Enter a valid email address, or leave the field blank.' };
  }
  if (deliveryLocation.length < 3 || deliveryLocation.length > 500) {
    return { error: 'Enter a delivery location (3 to 500 characters).' };
  }
  if (giftMessage.length > 500) {
    return { error: 'Gift messages must be 500 characters or fewer.' };
  }

  return {
    customer_name: customerName,
    phone,
    email: email || null,
    delivery_location: deliveryLocation,
    gift_message: giftMessage || null
  };
}

exports.getCheckout = (req, res) => {
  res.render('pages/checkout', {
    title: 'Checkout — Yarn & Bloom',
    activeNav: 'bag',
    deliveryFee: DELIVERY_FEE
  });
};

exports.quoteCart = async (req, res, next) => {
  try {
    const quote = await priceCart(req.body.items);
    if (quote.error) {
      return res.status(400).json({ error: quote.error });
    }

    res.json({
      items: quote.items,
      subtotal: quote.subtotal,
      deliveryFee: quote.delivery_fee,
      total: quote.total,
      currency: 'KES'
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const customer = validateCustomer(req.body);
    if (customer.error) {
      req.flash('error', customer.error);
      return res.redirect('/checkout');
    }

    const quote = await priceCart(req.body.cart_items);
    if (quote.error) {
      req.flash('error', quote.error);
      return res.redirect('/bag');
    }

    const referenceNumber = `YB-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    await StoreOrder.create({
      reference_number: referenceNumber,
      ...customer,
      subtotal: quote.subtotal,
      delivery_fee: quote.delivery_fee,
      total: quote.total
    }, quote.items);

    res.redirect(`/checkout/confirmation/${encodeURIComponent(referenceNumber)}`);
  } catch (error) {
    next(error);
  }
};

exports.getConfirmation = async (req, res, next) => {
  try {
    const order = await StoreOrder.findByReference(req.params.referenceNumber);
    if (!order) {
      return res.status(404).render('pages/404', {
        title: 'Order Not Found — Yarn & Bloom',
        activeNav: 'bag'
      });
    }

    const whatsappLines = [
      `Hello Yarn & Bloom! I placed an order enquiry (${order.reference_number}).`,
      '',
      ...order.items.map(item =>
        `• ${item.product_name} — ${item.selected_color} × ${item.quantity} (${formatKSh(item.line_total)})${item.customization ? `; Personalisation: ${item.customization}` : ''}`
      ),
      '',
      `Subtotal: ${formatKSh(order.subtotal)}`,
      `Delivery: ${formatKSh(order.delivery_fee)}`,
      `Estimated total: ${formatKSh(order.total)}`,
      `Delivery location: ${order.delivery_location}`,
      `Phone: ${order.phone}`,
      '',
      'Please confirm availability and payment details. Thank you!'
    ];
    const whatsappUrl = WhatsAppService.createWhatsAppUrl(whatsappLines.join('\n'));

    res.render('pages/checkout-confirmation', {
      title: 'Order Enquiry Received — Yarn & Bloom',
      activeNav: 'bag',
      order,
      whatsappUrl,
      formatKSh
    });
  } catch (error) {
    next(error);
  }
};
