const db = require('../config/database');

class Category {
  /**
   * Find all categories ordered by display_order
   */
  static async findAll() {
    const sql = `
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `;
    return db.query(sql);
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const sql = `SELECT * FROM categories WHERE id = ?`;
    try {
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Category.findById] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find category by slug
   */
  static async findBySlug(slug) {
    const sql = `SELECT * FROM categories WHERE slug = ?`;
    try {
      const rows = await db.query(sql, [slug]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Category.findBySlug] Query error:', err.message);
      return null;
    }
  }

  /**
   * Create a new category
   */
  static async create({ name, slug, description = '', image_url = '', display_order = 0 }) {
    const sql = `
      INSERT INTO categories (name, slug, description, image_url, display_order)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [name, slug, description, image_url, display_order]);
    return result.insertId;
  }

  /**
   * Update category
   */
  static async update(id, { name, slug, description = '', image_url = '', display_order = 0 }) {
    const sql = `
      UPDATE categories SET
        name = ?, slug = ?, description = ?, image_url = ?, display_order = ?
      WHERE id = ?
    `;
    return await db.query(sql, [name, slug, description, image_url, display_order, id]);
  }

  /**
   * Delete category
   */
  static async delete(id) {
    return await db.query('DELETE FROM categories WHERE id = ?', [id]);
  }
}

module.exports = Category;
