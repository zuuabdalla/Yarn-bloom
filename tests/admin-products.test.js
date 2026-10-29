const request = require('supertest');

jest.mock('../config/database', () => ({
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/Admin', () => ({
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  getSettings: jest.fn()
}));

jest.mock('../models/Product', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  countAll: jest.fn()
}));

jest.mock('../models/Category', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/Review', () => ({
  findFeatured: jest.fn(),
  findByProduct: jest.fn()
}));

const app = require('../app');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('admin product publishing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Admin.getSettings.mockResolvedValue({});
    Admin.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'superadmin',
      password_hash: 'hash'
    });
    Admin.verifyPassword.mockResolvedValue(true);
    Category.findAll.mockResolvedValue([]);
    Product.create.mockResolvedValue(42);
    Product.countAll.mockResolvedValue(1);
  });

  test('shows a newly created active product on the shop page', async () => {
    const newProduct = {
      id: 42,
      name: 'New Crochet Bouquet',
      slug: 'new-crochet-bouquet-123',
      price: 1800,
      short_description: 'A new handmade bouquet.',
      stock_status: 'in_stock',
      primary_image: '/images/products/sunday-tote.svg',
      is_customizable: 0
    };
    Product.findAll.mockResolvedValue([newProduct]);

    const admin = request.agent(app);
    await admin.post('/admin/login').send({
      username: 'admin',
      password: 'valid-password'
    });

    const createResponse = await admin.post('/admin/products/new').send({
      name: 'New Crochet Bouquet',
      category_id: '',
      price: '1800',
      short_description: 'A new handmade bouquet.',
      detailed_description: 'A handmade bouquet created in our studio.'
    });

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.location).toBe('/shop');
    expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Crochet Bouquet',
      is_active: true
    }));

    const shopResponse = await admin.get(createResponse.headers.location);

    expect(shopResponse.status).toBe(200);
    expect(shopResponse.text).toContain('New Crochet Bouquet');
    expect(shopResponse.text).toContain('has been successfully created!');
  });

  test('shows validation errors and preserves entered values when creation fails validation', async () => {
    const admin = request.agent(app);
    await admin.post('/admin/login').send({
      username: 'admin',
      password: 'valid-password'
    });

    const invalidDescription = 'x'.repeat(256);
    const createResponse = await admin.post('/admin/products/new').send({
      name: 'Unfinished Bouquet',
      price: '1800',
      short_description: invalidDescription,
      detailed_description: 'A handmade bouquet created in our studio.'
    });

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.location).toBe('/admin/products/new');
    expect(Product.create).not.toHaveBeenCalled();

    const formResponse = await admin.get(createResponse.headers.location);

    expect(formResponse.status).toBe(200);
    expect(formResponse.text).toContain('Short description cannot exceed 255 characters.');
    expect(formResponse.text).toContain('value="Unfinished Bouquet"');
    expect(formResponse.text).toContain(invalidDescription);
  });
});
