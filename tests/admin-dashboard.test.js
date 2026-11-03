const ejs = require('ejs');
const path = require('path');

jest.mock('../models/Admin', () => ({ getSettings: jest.fn() }));
jest.mock('../models/Product', () => ({ countAll: jest.fn() }));
jest.mock('../models/Category', () => ({ findAll: jest.fn() }));
jest.mock('../models/CustomOrder', () => ({
  findAll: jest.fn(),
  countByStatus: jest.fn()
}));
jest.mock('../models/GiftBox', () => ({ findAll: jest.fn() }));
jest.mock('../models/Contact', () => ({
  findAll: jest.fn(),
  countUnread: jest.fn()
}));
jest.mock('../models/Review', () => ({ findAll: jest.fn() }));
jest.mock('../models/StoreOrder', () => ({ findAll: jest.fn() }));
jest.mock('../models/AdminAccessRequest', () => ({
  findAll: jest.fn(),
  countPending: jest.fn()
}));

const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');
const CustomOrder = require('../models/CustomOrder');
const GiftBox = require('../models/GiftBox');
const Contact = require('../models/Contact');
const Review = require('../models/Review');
const StoreOrder = require('../models/StoreOrder');
const AdminAccessRequest = require('../models/AdminAccessRequest');
const adminController = require('../controllers/adminController');
const dashboardPath = path.join(__dirname, '..', 'views', 'admin', 'dashboard.ejs');

describe('admin dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Product.countAll.mockResolvedValue(58);
    Category.findAll.mockResolvedValue([{ id: 1, name: 'Crochet bags' }]);
    CustomOrder.findAll.mockResolvedValue([{
      customer_name: 'Grace W.',
      category_name: 'Crochet Flowers',
      occasion: 'Birthday',
      status: 'pending'
    }]);
    CustomOrder.countByStatus.mockResolvedValue([{ status: 'pending', count: 2 }]);
    GiftBox.findAll.mockResolvedValue([{
      customer_name: 'Aisha',
      occasion: 'Thank you',
      color_theme: 'Sage and cream',
      status: 'pending',
      created_at: '2026-11-02T08:30:00Z'
    }]);
    Contact.findAll.mockResolvedValue([{
      name: 'Nadia',
      subject: 'Gift enquiry',
      status: 'unread'
    }]);
    Contact.countUnread.mockResolvedValue(1);
    Review.findAll.mockResolvedValue([]);
    StoreOrder.findAll.mockResolvedValue([{
      reference_number: 'YB-1084',
      customer_name: 'Amina Mwangi',
      delivery_location: 'Westlands, Nairobi',
      created_at: '2026-11-03T08:30:00Z',
      items: [{ product_name: 'Meadow Blossom Bag', quantity: 1 }],
      total: 4800,
      status: 'pending'
    }]);
    AdminAccessRequest.findAll.mockResolvedValue([]);
    AdminAccessRequest.countPending.mockResolvedValue(0);
    Admin.getSettings.mockResolvedValue({});
  });

  test('renders live studio metrics and recent customer activity', async () => {
    const response = { render: jest.fn() };
    await adminController.getDashboard({}, response, error => { throw error; });

    expect(response.render).toHaveBeenCalledWith('admin/dashboard', expect.objectContaining({
      stats: expect.objectContaining({
        totalProducts: 58,
        totalCategories: 1,
        pendingOrders: 2,
        unreadContacts: 1
      }),
      recentStoreOrders: expect.arrayContaining([
        expect.objectContaining({ reference_number: 'YB-1084' })
      ])
    }));

    const [, locals] = response.render.mock.calls[0];
    const html = await ejs.renderFile(dashboardPath, {
      ...locals,
      adminUser: { username: 'Wanjiku' }
    });

    expect(html).toContain('Welcome back, Wanjiku.');
    expect(html).toContain('Meadow Blossom Bag');
    expect(html).toContain('YB-1084');
    expect(html).toContain('Gift enquiry');
    expect(html).toContain('Sage and cream');
    expect(html).toContain('id="business-settings"');
  });
});
