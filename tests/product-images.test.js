jest.mock('../config/database', () => ({
  getConnection: jest.fn()
}));

const db = require('../config/database');
const Product = require('../models/Product');

describe('admin product image persistence', () => {
  let connection;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue([{ insertId: 17, affectedRows: 1 }, []]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);
  });

  test('creates a product and saves its primary and additional images atomically', async () => {
    const productId = await Product.create({
      category_id: null,
      name: 'Crochet Bouquet',
      slug: 'crochet-bouquet-unique',
      short_description: 'A handmade flower bouquet.',
      detailed_description: 'A bouquet made by hand in Nairobi.',
      price: 1800,
      primary_image: '/uploads/primary.png',
      gallery_images: ['/uploads/extra-one.png', '/uploads/extra-two.png']
    });

    expect(productId).toBe(17);
    expect(connection.execute).toHaveBeenCalledTimes(4);
    expect(connection.execute.mock.calls.slice(1).map(call => call[1][1])).toEqual([
      '/uploads/primary.png',
      '/uploads/extra-one.png',
      '/uploads/extra-two.png'
    ]);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('updates the primary image and appends additional images transactionally', async () => {
    connection.execute.mockImplementation(async (sql) => {
      if (sql.startsWith('SELECT id FROM product_images')) {
        return [[], []];
      }
      return [{ affectedRows: 1 }, []];
    });

    await Product.update(17, {
      category_id: 1,
      name: 'Updated Bouquet',
      slug: 'updated-bouquet',
      short_description: 'Updated short description.',
      detailed_description: 'Updated detailed description.',
      price: 1900,
      primary_image: '/uploads/new-primary.png',
      gallery_images: ['/uploads/new-detail.png']
    });

    expect(connection.execute).toHaveBeenCalledWith(
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
      [17]
    );
    expect(connection.execute.mock.calls.filter(call => call[0].includes('INSERT INTO product_images'))).toHaveLength(2);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
