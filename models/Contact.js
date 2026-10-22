const db = require('../config/database');

class Contact {
  /**
   * Save a customer contact message
   */
  static async create(data) {
    const sql = `
      INSERT INTO contact_enquiries (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'unread')
    `;
    const params = [
      data.name,
      data.email,
      data.phone || null,
      data.subject,
      data.message
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Find all contact messages (for Admin)
   */
  static async findAll({ status = null, limit = 50, offset = 0 } = {}) {
    let sql = `SELECT * FROM contact_enquiries`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    try {
      return await db.query(sql, params);
    } catch (err) {
      console.error('[Contact.findAll] Query error:', err.message);
      return [];
    }
  }

  /**
   * Update message status
   */
  static async updateStatus(id, status, adminNotes = null) {
    let sql = `UPDATE contact_enquiries SET status = ?`;
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
   * Count unread contact enquiries
   */
  static async countUnread() {
    const sql = `SELECT COUNT(*) AS total FROM contact_enquiries WHERE status = 'unread'`;
    try {
      const rows = await db.query(sql);
      return rows[0] ? rows[0].total : 0;
    } catch (err) {
      console.error('[Contact.countUnread] Query error:', err.message);
      return 0;
    }
  }
}

module.exports = Contact;
