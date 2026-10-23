const AiGiftService = require('../services/aiGiftService');

const products = [
  {
    id: 1,
    name: 'Sage Crochet Tote',
    category_name: 'Crochet Bags',
    category_slug: 'crochet-bags',
    short_description: 'A handmade everyday tote.',
    price: 900,
    is_featured: 1
  },
  {
    id: 2,
    name: 'Blush Flower Bouquet',
    category_name: 'Flower Bouquets',
    category_slug: 'flower-bouquets',
    short_description: 'Everlasting crochet flowers.',
    price: 1800,
    is_featured: 1
  },
  {
    id: 3,
    name: 'Crochet Teddy',
    category_name: 'Crochet Toys',
    category_slug: 'crochet-toys',
    short_description: 'A soft crochet teddy.',
    price: 500,
    is_featured: 0
  }
];

describe('AI gift recommendation service', () => {
  const originalGatewayKey = process.env.AI_GATEWAY_API_KEY;
  const originalOidcToken = process.env.VERCEL_OIDC_TOKEN;

  beforeEach(() => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  afterAll(() => {
    if (originalGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = originalGatewayKey;
    if (originalOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN = originalOidcToken;
  });

  test('parses typed and ranged budgets', () => {
    expect(AiGiftService.getBudgetMaximum('KSh 1,500')).toBe(1500);
    expect(AiGiftService.getBudgetMaximum('1500-3500')).toBe(3500);
    expect(AiGiftService.getBudgetMaximum('above-6000')).toBe(Infinity);
  });

  test('uses catalog matching and keeps finder results within budget', async () => {
    const result = await AiGiftService.getGiftFinderRecommendations(products, {
      recipient: 'friend',
      budget: 'KSh 1,000',
      preference: 'bags'
    });

    expect(result.source).toBe('catalog');
    expect(result.recommendations.map(product => product.id)).toContain(1);
    expect(result.recommendations.every(product => Number(product.price) <= 1000)).toBe(true);
  });

  test('keeps gift box product suggestions within budget after reserving extras', async () => {
    const result = await AiGiftService.getGiftBoxRecommendations(products, {
      recipient: 'friend',
      budget: 'KSh 1,800'
    });

    expect(result.source).toBe('catalog');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.reduce((total, product) => total + Number(product.price), 0)).toBeLessThanOrEqual(1000);
  });
});
