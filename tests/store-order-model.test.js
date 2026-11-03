jest.mock('../config/database', () => ({
  getConnection: jest.fn(),
  query: jest.fn()
}));

const db = require('../config/database');
const StoreOrder = require('../models/StoreOrder');

describe('StoreOrder transactions', () => {
  let connection;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockImplementation(async sql => (
        sql.startsWith('SELECT id, is_active, stock_status, stock_quantity')
          ? [[{ id: 8, is_active: 1, stock_status: 'in_stock', stock_quantity: 4 }], []]
          : [{ insertId: 41, affectedRows: 1 }, []]
      )),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);
  });

  test('loads recent orders with their line items', async () => {
    db.query
      .mockResolvedValueOnce([{ id: 41, reference_number: 'YB-RECENT' }])
      .mockResolvedValueOnce([{ order_id: 41, product_name: 'Sage Tote', quantity: 2 }]);

    await expect(StoreOrder.findAll()).resolves.toEqual([{
      id: 41,
      reference_number: 'YB-RECENT',
      items: [{ order_id: 41, product_name: 'Sage Tote', quantity: 2 }]
    }]);
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT * FROM store_orders ORDER BY created_at DESC LIMIT ?',
      [50]
    );
    expect(db.query.mock.calls[1][0]).toContain('WHERE order_id IN (?)');
  });

  test('updates an order status using its id', async () => {
    db.query.mockResolvedValue({ affectedRows: 1 });
    await StoreOrder.updateStatus(41, 'confirmed');
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE store_orders SET status = ? WHERE id = ?',
      ['confirmed', 41]
    );
  });

  test('persists order and line items in one transaction', async () => {
    const orderId = await StoreOrder.create({
      reference_number: 'YB-TEST-1',
      customer_name: 'Nia Wanjiku',
      phone: '+254712345678',
      email: null,
      delivery_location: 'Westlands, Nairobi',
      gift_message: null,
      subtotal: 3200,
      delivery_fee: 0,
      total: 3200
    }, [{
      id: 8,
      name: 'Sage Tote',
      slug: 'sage-tote',
      unit_price: 3200,
      quantity: 1,
      color: 'Sage',
      customization: '',
      line_total: 3200
    }]);

    expect(orderId).toBe(41);
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledTimes(4);
    expect(connection.execute.mock.calls[0][0]).toContain('SELECT id, is_active, stock_status, stock_quantity');
    expect(connection.execute.mock.calls[1][0]).toContain('stock_quantity = stock_quantity - ?');
    expect(connection.execute.mock.calls[2][0]).toContain('INSERT INTO store_orders');
    expect(connection.execute.mock.calls[3][0]).toContain('INSERT INTO store_order_items');
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('does not save an order when tracked stock is insufficient', async () => {
    connection.execute.mockImplementation(async sql => (
      sql.startsWith('SELECT id, is_active, stock_status, stock_quantity')
        ? [[{ id: 8, is_active: 1, stock_status: 'in_stock', stock_quantity: 1 }], []]
        : [{ insertId: 41, affectedRows: 1 }, []]
    ));

    await expect(StoreOrder.create({
      reference_number: 'YB-OUT-OF-STOCK',
      customer_name: 'Nia Wanjiku',
      phone: '+254712345678',
      delivery_location: 'Westlands, Nairobi',
      subtotal: 6400,
      delivery_fee: 0,
      total: 6400
    }, [{
      id: 8,
      name: 'Sage Tote',
      slug: 'sage-tote',
      unit_price: 3200,
      quantity: 2,
      color: 'Sage',
      line_total: 6400
    }])).rejects.toMatchObject({ code: 'PRODUCT_STOCK_UNAVAILABLE' });

    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  test('rolls back and releases a failed order transaction', async () => {
    connection.execute.mockImplementation(async sql => {
      if (sql.startsWith('SELECT id, is_active, stock_status, stock_quantity')) {
        return [[{ id: 8, is_active: 1, stock_status: 'in_stock', stock_quantity: 4 }], []];
      }
      if (sql.startsWith('UPDATE products')) return [{ affectedRows: 1 }, []];
      if (sql.startsWith('INSERT INTO store_orders')) return [{ insertId: 41 }, []];
      throw new Error('order item insert failed');
    });

    await expect(StoreOrder.create({
      reference_number: 'YB-TEST-2',
      customer_name: 'Nia Wanjiku',
      phone: '+254712345678',
      delivery_location: 'Westlands, Nairobi',
      subtotal: 3200,
      delivery_fee: 0,
      total: 3200
    }, [{
      id: 8,
      name: 'Sage Tote',
      slug: 'sage-tote',
      unit_price: 3200,
      quantity: 1,
      color: 'Sage',
      line_total: 3200
    }])).rejects.toThrow('order item insert failed');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
