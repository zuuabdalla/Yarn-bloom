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
      const productIds = [...new Set(items.map(item => Number(item.id)))].sort((a, b) => a - b);
      const productPlaceholders = productIds.map(() => '?').join(', ');
      const [products] = await connection.execute(
        `SELECT id, is_active, stock_status, stock_quantity
         FROM products
         WHERE id IN (${productPlaceholders})
         ORDER BY id
         FOR UPDATE`,
        productIds
      );
      const productsById = new Map(products.map(product => [Number(product.id), product]));
      const quantitiesByProduct = new Map();
      for (const item of items) {
        const productId = Number(item.id);
        quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + Number(item.quantity));
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        const product = productsById.get(productId);
        if (!product || !product.is_active ||
            product.stock_status === 'out_of_stock' ||
            (product.stock_status === 'in_stock' && Number(product.stock_quantity) < quantity)) {
          const error = new Error('A product in the order is no longer available in the requested quantity.');
          error.code = 'PRODUCT_STOCK_UNAVAILABLE';
          throw error;
        }

        if (product.stock_status === 'in_stock') {
          const [updateResult] = await connection.execute(
            `UPDATE products
             SET stock_quantity = stock_quantity - ?
             WHERE id = ? AND is_active = 1 AND stock_status = 'in_stock' AND stock_quantity >= ?`,
            [quantity, productId, quantity]
          );
          if (updateResult.affectedRows !== 1) {
            const error = new Error('Product stock changed while the order was being submitted.');
            error.code = 'PRODUCT_STOCK_UNAVAILABLE';
            throw error;
          }
        }
      }

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
