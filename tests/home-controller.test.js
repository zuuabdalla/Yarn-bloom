const ejs = require('ejs');
const path = require('path');

jest.mock('../models/Product', () => ({ findFeatured: jest.fn() }));
jest.mock('../models/Category', () => ({ findAll: jest.fn() }));
jest.mock('../models/Review', () => ({ findFeatured: jest.fn() }));
jest.mock('../models/Admin', () => ({ getSettings: jest.fn() }));

const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const WhatsAppService = require('../services/whatsappService');
const homeController = require('../controllers/homeController');

describe('homepage rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Product.findFeatured.mockResolvedValue([{
      id: 8,
      name: 'Sage Tote',
      slug: 'sage-tote',
      price: 3200,
      stock_status: 'in_stock',
      stock_quantity: 2,
      short_description: 'A handmade crochet tote.',
      primary_image: '/images/sage-tote.png',
      available_colors: 'Sage, Cream',
      is_customizable: 1
    }]);
    Category.findAll.mockResolvedValue([]);
    Review.findFeatured.mockResolvedValue([]);
    Admin.getSettings.mockResolvedValue({});
  });

  test('passes WhatsAppService to featured product cards', async () => {
    const response = { render: jest.fn() };
    await homeController.getHome({}, response, error => { throw error; });

    expect(response.render).toHaveBeenCalledWith('pages/home', expect.objectContaining({
      WhatsAppService
    }));

    const [, locals] = response.render.mock.calls[0];
    const html = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'pages', 'home.ejs'),
      locals
    );

    expect(html).toContain('Sage Tote');
    expect(html).toContain('2 in stock');
  });
});
