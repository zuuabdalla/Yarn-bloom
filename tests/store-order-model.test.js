jest.mock('../config/database', () => ({
  getConnection: jest.fn()
}));

const db = require('../config/database');
const StoreOrder = require('../models/StoreOrder');

describe('StoreOrder transactions', () => {
  let connection;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue([{ insertId: 41 }, []]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);
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
    expect(connection.execute).toHaveBeenCalledTimes(2);
    expect(connection.execute.mock.calls[0][0]).toContain('INSERT INTO store_orders');
    expect(connection.execute.mock.calls[1][0]).toContain('INSERT INTO store_order_items');
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('rolls back and releases a failed order transaction', async () => {
    connection.execute
      .mockResolvedValueOnce([{ insertId: 41 }, []])
      .mockRejectedValueOnce(new Error('order item insert failed'));

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
