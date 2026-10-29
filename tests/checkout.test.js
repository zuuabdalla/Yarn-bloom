const request = require('supertest');

jest.mock('../config/database', () => ({
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/Admin', () => ({
  getSettings: jest.fn()
}));

jest.mock('../models/Product', () => ({
  findActiveByIds: jest.fn()
}));

jest.mock('../models/Category', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/StoreOrder', () => ({
  create: jest.fn(),
  findByReference: jest.fn()
}));

const app = require('../app');
const Product = require('../models/Product');
const StoreOrder = require('../models/StoreOrder');

describe('checkout order flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Product.findActiveByIds.mockResolvedValue([{
      id: 8,
      name: 'Sage Tote',
      slug: 'sage-tote',
      price: '3200.00',
      stock_status: 'made_to_order',
      estimated_production_days: 4,
      available_colors: 'Sage, Cream',
      is_customizable: 1
    }]);
  });

  test('quotes catalog prices rather than client-submitted prices', async () => {
    const response = await request(app).post('/checkout/quote').send({
      items: [{
        productId: 8,
        quantity: 2,
        color: 'Sage',
        price: 0.01,
        name: 'Tampered name'
      }]
    });

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toEqual(expect.objectContaining({
      id: 8,
      name: 'Sage Tote',
      unit_price: 3200,
      line_total: 6400
    }));
    expect(response.body.subtotal).toBe(6400);
    expect(response.body.deliveryFee).toBe(0);
    expect(response.body.total).toBe(6400);
  });

  test('saves a validated guest order and redirects to its confirmation', async () => {
    const response = await request(app).post('/checkout').type('form').send({
      cart_items: JSON.stringify([{ productId: 8, quantity: 1, color: 'Cream' }]),
      customer_name: 'Nia Wanjiku',
      phone: '+254 712 345 678',
      email: 'nia@example.com',
      delivery_location: 'Westlands, Nairobi',
      gift_message: 'Made with love'
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/^\/checkout\/confirmation\/YB-/);
    expect(StoreOrder.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_name: 'Nia Wanjiku',
      phone: '+254 712 345 678',
      email: 'nia@example.com',
      delivery_location: 'Westlands, Nairobi',
      gift_message: 'Made with love',
      subtotal: 3200,
      delivery_fee: 0,
      total: 3200
    }), [expect.objectContaining({
      id: 8,
      unit_price: 3200,
      quantity: 1,
      color: 'Cream'
    })]);
  });

  test('rejects invalid quantities before creating an order', async () => {
    const response = await request(app).post('/checkout').type('form').send({
      cart_items: JSON.stringify([{ productId: 8, quantity: 100, color: 'Sage' }]),
      customer_name: 'Nia Wanjiku',
      phone: '+254712345678',
      delivery_location: 'Westlands, Nairobi'
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/bag');
    expect(StoreOrder.create).not.toHaveBeenCalled();
  });

  test('rejects a cart containing products that are not active', async () => {
    Product.findActiveByIds.mockResolvedValue([]);

    const response = await request(app).post('/checkout/quote').send({
      items: [{ productId: 8, quantity: 1, color: 'Sage' }]
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('unavailable');
  });
});
