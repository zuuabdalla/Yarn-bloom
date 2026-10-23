const ejs = require('ejs');
const path = require('path');

jest.mock('../models/Product', () => ({
  findForGiftBox: jest.fn()
}));

jest.mock('../models/Admin', () => ({
  getSettings: jest.fn()
}));

jest.mock('../services/aiGiftService', () => ({
  getGiftBoxRecommendations: jest.fn()
}));

const Product = require('../models/Product');
const Admin = require('../models/Admin');
const AiGiftService = require('../services/aiGiftService');
const giftBoxController = require('../controllers/giftBoxController');
const viewsDirectory = path.join(__dirname, '..', 'views');

function renderPage(file, locals) {
  return ejs.renderFile(path.join(viewsDirectory, file), locals);
}

describe('AI gift builder and finder pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows both AI gift tools in the storefront navigation', async () => {
    const html = await renderPage('partials/header.ejs', {
      activeNav: '',
      settings: {},
      title: 'Yarn & Bloom'
    });

    expect(html).toContain('href="/gift-finder"');
    expect(html).toContain('AI Gift Finder');
    expect(html).toContain('href="/gift-box"');
    expect(html).toContain('AI Gift Builder');
  });

  test('renders the finder prompt and its initial state', async () => {
    const html = await renderPage('pages/gift-finder.ejs', {
      answers: null,
      results: null,
      recommendationSource: null,
      recommendationSummary: null,
      formatKSh: amount => `KSh ${amount}`
    });

    expect(html).toContain('AI gift finder');
    expect(html).toContain('name="preference"');
    expect(html).toContain('Find my gift');
  });

  test('renders builder suggestions and preselects recommended products', async () => {
    const html = await renderPage('pages/gift-box.ejs', {
      answers: { recipient: 'Mum', budget: '5000' },
      suggestion: {
        source: 'ai',
        summary: 'A thoughtful handmade set.',
        recommendations: [{
          id: 1,
          name: 'Sage Crochet Tote',
          price: 900,
          matchReasons: ['A practical gift in her favourite colour.']
        }]
      },
      selectedProductIds: ['1'],
      bagItems: [{ id: 1, name: 'Sage Crochet Tote', price: 900 }],
      flowerItems: [],
      toyItems: [],
      otherItems: [],
      formatKSh: amount => `KSh ${amount}`
    });

    expect(html).toContain('A thoughtful handmade set.');
    expect(html).toContain('A practical gift in her favourite colour.');
    expect(html).toContain('name="selected_product_ids" value="1" checked');
    expect(html).toContain('Create my gift box');
  });

  test('uses preferences to generate and render a gift box suggestion', async () => {
    const products = [{
      id: 1,
      name: 'Sage Crochet Tote',
      category_name: 'Crochet Bags',
      category_slug: 'crochet-bags',
      price: 900
    }];
    const recommendation = {
      id: 1,
      name: 'Sage Crochet Tote',
      price: 900,
      matchReasons: ['A useful handmade gift.']
    };
    const suggestion = {
      source: 'ai',
      summary: 'A thoughtful choice.',
      recommendations: [recommendation]
    };
    Product.findForGiftBox.mockResolvedValue(products);
    Admin.getSettings.mockResolvedValue({});
    AiGiftService.getGiftBoxRecommendations.mockResolvedValue(suggestion);
    const response = { render: jest.fn() };

    await giftBoxController.getGiftBoxSuggestions({
      body: {
        recipient: 'mum',
        occasion: 'birthday',
        max_budget: '3000',
        color_theme: 'sage',
        gift_style: 'practical'
      }
    }, response, error => { throw error; });

    expect(AiGiftService.getGiftBoxRecommendations).toHaveBeenCalledWith(products, {
      recipient: 'mum',
      occasion: 'birthday',
      budget: '3000',
      colors: 'sage',
      preference: 'practical'
    });
    expect(response.render).toHaveBeenCalledWith('pages/gift-box', expect.objectContaining({
      suggestion,
      selectedProductIds: ['1'],
      bagItems: products
    }));
  });
});
