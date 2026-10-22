const db = require('../config/database');

class Review {
  /**
   * Find approved reviews for a product
   */
  static async findByProduct(productId) {
    const sql = `
      SELECT * FROM reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
    `;
    try {
      return await db.query(sql, [productId]);
    } catch (err) {
      console.error('[Review.findByProduct] Query error:', err.message);
      return [];
    }
  }

  /**
   * Find featured testimonials for homepage
   */
  static async findFeatured(limit = 3) {
    const sql = `
      SELECT r.*, p.name AS product_name, p.slug AS product_slug
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.is_approved = 1 AND r.is_featured = 1
      ORDER BY r.created_at DESC
      LIMIT ?
    `;
    try {
      return await db.query(sql, [parseInt(limit, 10)]);
    } catch (err) {
      console.error('[Review.findFeatured] Query error:', err.message);
      return [];
    }
  }

  /**
   * Submit a new review
   */
  static async create({ product_id = null, customer_name, rating = 5, comment }) {
    const sql = `
      INSERT INTO reviews (product_id, customer_name, rating, comment, is_approved, is_featured)
      VALUES (?, ?, ?, ?, 1, 0)
    `;
    const result = await db.query(sql, [product_id || null, customer_name, parseInt(rating, 10), comment]);
    return result.insertId;
  }

  /**
   * Find all reviews (Admin)
   */
  static async findAll({ limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT r.*, p.name AS product_name
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    try {
      return await db.query(sql, [parseInt(limit, 10), parseInt(offset, 10)]);
    } catch (err) {
      console.error('[Review.findAll] Query error:', err.message);
      return [];
    }
  }

  /**
   * Update review approval or featured state
   */
  static async updateStatus(id, { is_approved, is_featured }) {
    let sql = `UPDATE reviews SET is_approved = ?, is_featured = ? WHERE id = ?`;
    return await db.query(sql, [is_approved ? 1 : 0, is_featured ? 1 : 0, id]);
  }

  /**
   * Delete review
   */
  static async delete(id) {
    return await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  }
}

module.exports = Review;
