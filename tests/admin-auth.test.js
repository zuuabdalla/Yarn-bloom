const request = require('supertest');

jest.mock('../config/database', () => ({
  testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../models/Admin', () => ({
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  create: jest.fn()
}));

const app = require('../app');
const Admin = require('../models/Admin');

describe('admin authentication pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test('allows only a superadmin to open the admin sign-up page', async () => {
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

  test('creates an admin account and redirects to the login page', async () => {
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
