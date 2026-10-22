const db = require('../config/database');

class GiftBox {
  /**
   * Save a gift box enquiry
   */
  static async create(data) {
    const sql = `
      INSERT INTO gift_box_enquiries (
        reference_number, customer_name, whatsapp_number, color_theme,
        recipient_name, gift_message, occasion, max_budget, estimated_total,
        selected_items, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const params = [
      data.reference_number,
      data.customer_name || 'Valued Customer',
      data.whatsapp_number,
      data.color_theme,
      data.recipient_name || null,
      data.gift_message || null,
      data.occasion || null,
      data.max_budget || null,
      data.estimated_total,
      JSON.stringify(data.selected_items || [])
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Find gift box enquiry by reference
   */
  static async findByReference(referenceNumber) {
    const sql = `SELECT * FROM gift_box_enquiries WHERE reference_number = ?`;
    try {
      const rows = await db.query(sql, [referenceNumber]);
      if (rows[0] && typeof rows[0].selected_items === 'string') {
        try {
          rows[0].selected_items = JSON.parse(rows[0].selected_items);
        } catch (e) {
          rows[0].selected_items = [];
        }
      }
      return rows[0] || null;
    } catch (err) {
      console.error('[GiftBox.findByReference] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find all gift box enquiries (for Admin)
   */
  static async findAll({ status = null, limit = 50, offset = 0 } = {}) {
    let sql = `SELECT * FROM gift_box_enquiries`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    try {
      const rows = await db.query(sql, params);
      return rows.map(r => {
        if (typeof r.selected_items === 'string') {
          try {
            r.selected_items = JSON.parse(r.selected_items);
          } catch (e) {
            r.selected_items = [];
          }
        }
        return r;
      });
    } catch (err) {
      console.error('[GiftBox.findAll] Query error:', err.message);
      return [];
    }
  }

  /**
   * Update status
   */
  static async updateStatus(id, status, adminNotes = null) {
    let sql = `UPDATE gift_box_enquiries SET status = ?`;
    const params = [status];
    if (adminNotes !== null) {
      sql += `, admin_notes = ?`;
      params.push(adminNotes);
    }
    sql += ` WHERE id = ?`;
    params.push(id);
    return await db.query(sql, params);
  }
}

module.exports = GiftBox;
