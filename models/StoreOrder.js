const db = require('../config/database');

class StoreOrder {
  static async findAll({ limit = 50 } = {}) {
    const orders = await db.query(
      'SELECT * FROM store_orders ORDER BY created_at DESC LIMIT ?',
      [Number.parseInt(limit, 10)]
    );
    if (!orders.length) return [];

    const placeholders = orders.map(() => '?').join(', ');
    const items = await db.query(
      `SELECT * FROM store_order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
      orders.map(order => order.id)
    );
    const itemsByOrder = new Map(orders.map(order => [order.id, []]));
    items.forEach(item => itemsByOrder.get(item.order_id).push(item));

    return orders.map(order => ({ ...order, items: itemsByOrder.get(order.id) }));
  }

  static async updateStatus(id, status) {
    return db.query('UPDATE store_orders SET status = ? WHERE id = ?', [status, id]);
  }

  static async create(order, items) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO store_orders (
          reference_number, customer_name, phone, email, delivery_location,
          gift_message, subtotal, delivery_fee, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.reference_number,
          order.customer_name,
          order.phone,
          order.email,
          order.delivery_location,
          order.gift_message,
          order.subtotal,
          order.delivery_fee,
          order.total
        ]
      );

      for (const item of items) {
        await connection.execute(
          `INSERT INTO store_order_items (
            order_id, product_id, product_name, product_slug, unit_price,
            quantity, selected_color, customization, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            item.id,
            item.name,
            item.slug,
            item.unit_price,
            item.quantity,
            item.color,
            item.customization || null,
            item.line_total
          ]
        );
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findByReference(referenceNumber) {
    const [orders, items] = await Promise.all([
      db.query('SELECT * FROM store_orders WHERE reference_number = ?', [referenceNumber]),
      db.query(
        `SELECT oi.* FROM store_order_items oi
         INNER JOIN store_orders so ON so.id = oi.order_id
         WHERE so.reference_number = ?
         ORDER BY oi.id ASC`,
        [referenceNumber]
      )
    ]);

    return orders[0] ? { ...orders[0], items } : null;
  }
}

module.exports = StoreOrder;
