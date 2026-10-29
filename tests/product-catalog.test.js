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
    for (const column of ['p.name', 'p.short_description', 'p.detailed_description', 'p.available_colors', 'p.occasions']) {
      expect(listQuery).toContain(column);
      expect(countQuery).toContain(column);
    }
    expect(listParams.slice(0, 5)).toEqual(Array(5).fill('%sage%'));
    expect(countParams).toEqual(Array(5).fill('%sage%'));
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
