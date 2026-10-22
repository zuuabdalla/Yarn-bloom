const db = require('../config/database');

class CustomOrder {
  /**
   * Save a new custom order enquiry
   */
  static async create(data) {
    const sql = `
      INSERT INTO custom_order_enquiries (
        reference_number, customer_name, whatsapp_number, category_id,
        preferred_colors, desired_size, design_description, occasion,
        budget, required_date, reference_image_url, additional_instructions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const params = [
      data.reference_number,
      data.customer_name,
      data.whatsapp_number,
      data.category_id || null,
      data.preferred_colors || null,
      data.desired_size || null,
      data.design_description,
      data.occasion || null,
      data.budget || null,
      data.required_date || null,
      data.reference_image_url || null,
      data.additional_instructions || null
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Find by reference number
   */
  static async findByReference(referenceNumber) {
    const sql = `
      SELECT o.*, c.name AS category_name
      FROM custom_order_enquiries o
      LEFT JOIN categories c ON o.category_id = c.id
      WHERE o.reference_number = ?
    `;
    try {
      const rows = await db.query(sql, [referenceNumber]);
      return rows[0] || null;
    } catch (err) {
      console.error('[CustomOrder.findByReference] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find by ID
   */
  static async findById(id) {
    const sql = `
      SELECT o.*, c.name AS category_name
      FROM custom_order_enquiries o
      LEFT JOIN categories c ON o.category_id = c.id
      WHERE o.id = ?
    `;
    try {
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('[CustomOrder.findById] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find all enquiries (for Admin)
   */
  static async findAll({ status = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT o.*, c.name AS category_name
      FROM custom_order_enquiries o
      LEFT JOIN categories c ON o.category_id = c.id
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE o.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    try {
      return await db.query(sql, params);
    } catch (err) {
      console.error('[CustomOrder.findAll] Query error:', err.message);
      return [];
    }
  }

  /**
   * Update order status and optional admin note
   */
  static async updateStatus(id, status, adminNotes = null) {
    let sql = `UPDATE custom_order_enquiries SET status = ?`;
    const params = [status];

    if (adminNotes !== null) {
      sql += `, admin_notes = ?`;
      params.push(adminNotes);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    return await db.query(sql, params);
  }

  /**
   * Count total enquiries by status
   */
  static async countByStatus() {
    const sql = `
      SELECT status, COUNT(*) AS count
      FROM custom_order_enquiries
      GROUP BY status
    `;
    try {
      return await db.query(sql);
    } catch (err) {
      console.error('[CustomOrder.countByStatus] Query error:', err.message);
      return [];
    }
  }
}

module.exports = CustomOrder;
