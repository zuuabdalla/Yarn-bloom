jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const db = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('product catalog database queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('searches names, descriptions, colours, and occasions consistently', async () => {
    db.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    await Product.findAll({ search: 'sage', categorySlug: 'all', sortBy: 'price-asc' });
    await Product.countAll({ search: 'sage', categorySlug: 'all' });

    const [listQuery, listParams] = db.query.mock.calls[0];
    const [countQuery, countParams] = db.query.mock.calls[1];
    for (const column of ['p.name', 'p.short_description', 'p.detailed_description', 'c.name', 'p.available_colors', 'p.occasions']) {
      expect(listQuery).toContain(column);
      expect(countQuery).toContain(column);
    }
    expect(listParams.slice(0, 6)).toEqual(Array(6).fill('%sage%'));
    expect(countParams).toEqual(Array(6).fill('%sage%'));
  });

  test('filters shop availability using inventory quantities', async () => {
    db.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    await Product.findAll({ availability: 'available' });
    await Product.countAll({ availability: 'unavailable' });

    expect(db.query.mock.calls[0][0]).toContain("p.stock_status = 'in_stock' AND p.stock_quantity > 0");
    expect(db.query.mock.calls[1][0]).toContain("p.stock_status = 'in_stock' AND p.stock_quantity = 0");
  });

  test('allows admin listings to include deactivated products', async () => {
    db.query.mockResolvedValue([]);

    await Product.findAll({ includeInactive: true, limit: null });

    expect(db.query.mock.calls[0][0]).not.toContain('p.is_active = 1');
    expect(db.query.mock.calls[0][0]).not.toContain('LIMIT');
  });

  test('keeps customer listings limited to active products', async () => {
    db.query.mockResolvedValue([]);

    await Product.findAll();

    expect(db.query.mock.calls[0][0]).toContain('AND p.is_active = 1');
  });

  test('surfaces database errors instead of disguising them as an empty catalogue', async () => {
    const databaseError = new Error('database connection unavailable');
    db.query.mockRejectedValue(databaseError);

    await expect(Product.findAll()).rejects.toBe(databaseError);
    await expect(Product.countAll()).rejects.toBe(databaseError);
    await expect(Category.findAll()).rejects.toBe(databaseError);
  });

  test('only loads active product IDs for checkout', async () => {
    db.query.mockResolvedValue([]);

    await Product.findActiveByIds([2, 9]);

    expect(db.query.mock.calls[0][0]).toContain('WHERE is_active = 1 AND id IN (?, ?)');
    expect(db.query.mock.calls[0][1]).toEqual([2, 9]);
  });
});
