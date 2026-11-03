const request = require('supertest');
const fs = require('fs');
const path = require('path');

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
      stock_quantity: 3,
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
      stock_status: 'in_stock',
      stock_quantity: '3',
      short_description: 'A new handmade bouquet.',
      detailed_description: 'A handmade bouquet created in our studio.',
      is_active: 'on'
    });

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.location).toBe('/admin/products');
    expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Crochet Bouquet',
      is_active: true,
      stock_quantity: 3
    }));

    const shopResponse = await admin.get('/shop');

    expect(shopResponse.status).toBe(200);
    expect(shopResponse.text).toContain('New Crochet Bouquet');
    expect(shopResponse.text).toContain('has been successfully created.');
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
      stock_status: 'made_to_order',
      stock_quantity: '0',
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

  test('rejects invalid image content and removes the rejected upload', async () => {
    const admin = request.agent(app);
    await admin.post('/admin/login').send({
      username: 'admin',
      password: 'valid-password'
    });

    const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads');
    const filesBefore = fs.readdirSync(uploadDirectory).sort();
    const response = await admin.post('/admin/products/add')
      .field('name', 'Invalid image product')
      .field('price', '1800')
      .field('stock_status', 'in_stock')
      .field('stock_quantity', '2')
      .field('short_description', 'A product with an invalid image payload.')
      .field('detailed_description', 'The upload claims to be a PNG but contains plain text.')
      .attach('primary_image', Buffer.from('not an image'), {
        filename: 'invalid.png',
        contentType: 'image/png'
      });

    expect(response.status).toBe(302);
    expect(Product.create).not.toHaveBeenCalled();
    expect(fs.readdirSync(uploadDirectory).sort()).toEqual(filesBefore);
  });
});
