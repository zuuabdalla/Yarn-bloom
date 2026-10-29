const request = require('supertest');

jest.mock('../config/database', () => ({
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/Admin', () => ({
  countAll: jest.fn(),
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  create: jest.fn(),
  createInitialSuperadmin: jest.fn()
}));

jest.mock('../models/CustomOrder', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/GiftBox', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/Contact', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/Review', () => ({
  findAll: jest.fn()
}));

const app = require('../app');
const Admin = require('../models/Admin');
const CustomOrder = require('../models/CustomOrder');
const GiftBox = require('../models/GiftBox');
const Contact = require('../models/Contact');
const Review = require('../models/Review');

describe('admin authentication pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Admin.countAll.mockResolvedValue(1);
  });

  test('renders a private, unindexed admin login page', async () => {
    const response = await request(app).get('/admin/login');

    expect(response.status).toBe(200);
    expect(response.headers['x-robots-tag']).toContain('noindex');
    expect(response.text).toContain('<meta name="robots" content="noindex, nofollow, noarchive"');
    expect(response.text).toContain('autocomplete="current-password"');
    expect(response.text).not.toContain('class="main-nav"');
  });

  test('redirects unauthenticated visitors away from the admin dashboard', async () => {
    const response = await request(app).get('/admin/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/login');
  });

  test('renders enquiry management sections for an authenticated admin', async () => {
    Admin.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'superadmin',
      password_hash: 'hash'
    });
    Admin.verifyPassword.mockResolvedValue(true);
    CustomOrder.findAll.mockResolvedValue([]);
    GiftBox.findAll.mockResolvedValue([]);
    Contact.findAll.mockResolvedValue([]);
    Review.findAll.mockResolvedValue([]);

    const agent = request.agent(app);
    await agent.post('/admin/login').send({ username: 'admin', password: 'valid-password' });
    const response = await agent.get('/admin/enquiries');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Custom orders');
    expect(response.text).toContain('Gift box orders');
    expect(response.text).toContain('Contact messages');
    expect(response.text).toContain('Customer reviews');
    expect(response.text).toContain('No custom order enquiries yet.');
  });

  test('shows first-time setup before login and blocks public sign-up after setup', async () => {
    Admin.countAll.mockResolvedValue(0);
    const homeResponse = await request(app).get('/admin');
    expect(homeResponse.status).toBe(302);
    expect(homeResponse.headers.location).toBe('/admin/signup');

    const setupResponse = await request(app).get('/admin/signup');
    expect(setupResponse.status).toBe(200);
    expect(setupResponse.text).toContain('Set up admin');

    Admin.countAll.mockResolvedValue(1);
    const guestResponse = await request(app).get('/admin/signup');
    expect(guestResponse.status).toBe(302);
    expect(guestResponse.headers.location).toBe('/admin/login');

    Admin.findByUsername.mockResolvedValue({
      id: 2,
      username: 'staff',
      email: 'staff@example.com',
      role: 'admin',
      password_hash: 'hash'
    });
    Admin.verifyPassword.mockResolvedValue(true);

    const staffAgent = request.agent(app);
    await staffAgent.post('/admin/login').send({ username: 'staff', password: 'valid-password' });
    const staffResponse = await staffAgent.get('/admin/signup');

    expect(staffResponse.status).toBe(302);
    expect(staffResponse.headers.location).toBe('/admin/dashboard');

    Admin.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'superadmin',
      password_hash: 'hash'
    });

    const superadminAgent = request.agent(app);
    await superadminAgent.post('/admin/login').send({ username: 'admin', password: 'valid-password' });
    const superadminResponse = await superadminAgent.get('/admin/signup');

    expect(superadminResponse.status).toBe(200);
    expect(superadminResponse.headers['x-robots-tag']).toContain('noindex');
    expect(superadminResponse.text).toContain('Create admin');
    expect(superadminResponse.text).toContain('password_confirmation');
  });

  test('creates the first superadmin and redirects to the login page', async () => {
    Admin.countAll.mockResolvedValue(1);
    Admin.hashPassword.mockResolvedValue('new-password-hash');
    Admin.createInitialSuperadmin.mockResolvedValue({ insertId: 1 });

    const response = await request(app).post('/admin/signup').send({
      username: 'first.admin',
      email: 'first.admin@example.com',
      password: 'a-very-secure-password',
      password_confirmation: 'a-very-secure-password'
    });

    expect(Admin.createInitialSuperadmin).toHaveBeenCalledWith({
      username: 'first.admin',
      email: 'first.admin@example.com',
      passwordHash: 'new-password-hash'
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/login');
  });

  test('allows the superadmin to create another admin and redirects to login', async () => {
    Admin.countAll.mockResolvedValue(1);
    Admin.findByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'superadmin',
      password_hash: 'hash'
    });
    Admin.verifyPassword.mockResolvedValue(true);
    Admin.hashPassword.mockResolvedValue('new-password-hash');
    Admin.create.mockResolvedValue({ insertId: 2 });

    const agent = request.agent(app);
    await agent.post('/admin/login').send({ username: 'admin', password: 'valid-password' });
    const response = await agent.post('/admin/signup').send({
      username: 'new.admin',
      email: 'new.admin@example.com',
      password: 'a-very-secure-password',
      password_confirmation: 'a-very-secure-password'
    });

    expect(Admin.create).toHaveBeenCalledWith({
      username: 'new.admin',
      email: 'new.admin@example.com',
      passwordHash: 'new-password-hash'
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/login');

    const loginResponse = await agent.get('/admin/login');
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.text).toContain('Admin account created.');
  });
});
