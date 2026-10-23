const request = require('supertest');
const app = require('../app');

describe('admin authentication pages', () => {
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
});
