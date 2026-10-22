const db = require('../config/database');

class Product {
  /**
   * Find all products with optional filters (category, search, sorting)
   */
  static async findAll({ categorySlug = null, categoryId = null, search = '', sortBy = 'newest', limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    } else if (categorySlug && categorySlug !== 'all') {
      sql += ` AND c.slug = ?`;
      params.push(categorySlug);
    }

    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.detailed_description LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sort order
    switch (sortBy) {
      case 'price-asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price-desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'name-asc':
        sql += ` ORDER BY p.name ASC`;
        break;
      case 'featured':
        sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY p.created_at DESC`;
        break;
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    try {
      return await db.query(sql, params);
    } catch (err) {
      console.error('[Product.findAll] Query error:', err.message);
      return [];
    }
  }

  /**
   * Count products matching filters for pagination
   */
  static async countAll({ categorySlug = null, search = '' } = {}) {
    let sql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (categorySlug && categorySlug !== 'all') {
      sql += ` AND c.slug = ?`;
      params.push(categorySlug);
    }

    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    try {
      const rows = await db.query(sql, params);
      return rows[0] ? rows[0].total : 0;
    } catch (err) {
      console.error('[Product.countAll] Query error:', err.message);
      return 0;
    }
  }

  /**
   * Get featured products for homepage
   */
  static async findFeatured(limit = 4) {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;
    try {
      return await db.query(sql, [parseInt(limit, 10)]);
    } catch (err) {
      console.error('[Product.findFeatured] Query error:', err.message);
      return [];
    }
  }

  /**
   * Find product by ID
   */
  static async findById(id) {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    try {
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Product.findById] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find product by URL slug
   */
  static async findBySlug(slug) {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = 1
    `;
    try {
      const rows = await db.query(sql, [slug]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Product.findBySlug] Query error:', err.message);
      return null;
    }
  }

  /**
   * Get related products in the same category
   */
  static async findRelated(categoryId, currentProductId, limit = 4) {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RAND()
      LIMIT ?
    `;
    try {
      return await db.query(sql, [categoryId, currentProductId, parseInt(limit, 10)]);
    } catch (err) {
      console.error('[Product.findRelated] Query error:', err.message);
      return [];
    }
  }

  /**
   * Get gallery images for a product
   */
  static async getImages(productId) {
    const sql = `
      SELECT * FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    try {
      return await db.query(sql, [productId]);
    } catch (err) {
      console.error('[Product.getImages] Query error:', err.message);
      return [];
    }
  }

  /**
   * Add a gallery image
   */
  static async addImage(productId, imageUrl, altText = '', isPrimary = false, sortOrder = 0) {
    const sql = `
      INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await db.query(sql, [productId, imageUrl, altText, isPrimary ? 1 : 0, sortOrder]);
  }

  /**
   * Create a new product (Admin)
   */
  static async create(data) {
    const sql = `
      INSERT INTO products (
        category_id, name, slug, short_description, detailed_description,
        price, compare_at_price, stock_status, estimated_production_days,
        materials, dimensions, available_colors, is_customizable,
        is_featured, is_active, occasions, primary_image, care_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.category_id || null,
      data.name,
      data.slug,
      data.short_description,
      data.detailed_description,
      data.price,
      data.compare_at_price || null,
      data.stock_status || 'made_to_order',
      data.estimated_production_days || 3,
      data.materials || '100% Cotton Yarn',
      data.dimensions || null,
      data.available_colors || '',
      data.is_customizable ? 1 : 0,
      data.is_featured ? 1 : 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.occasions || '',
      data.primary_image,
      data.care_instructions || ''
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Update an existing product (Admin)
   */
  static async update(id, data) {
    const sql = `
      UPDATE products SET
        category_id = ?, name = ?, slug = ?, short_description = ?,
        detailed_description = ?, price = ?, compare_at_price = ?,
        stock_status = ?, estimated_production_days = ?, materials = ?,
        dimensions = ?, available_colors = ?, is_customizable = ?,
        is_featured = ?, is_active = ?, occasions = ?, primary_image = ?,
        care_instructions = ?
      WHERE id = ?
    `;
    const params = [
      data.category_id || null,
      data.name,
      data.slug,
      data.short_description,
      data.detailed_description,
      data.price,
      data.compare_at_price || null,
      data.stock_status || 'made_to_order',
      data.estimated_production_days || 3,
      data.materials || '100% Cotton Yarn',
      data.dimensions || null,
      data.available_colors || '',
      data.is_customizable ? 1 : 0,
      data.is_featured ? 1 : 0,
      data.is_active ? 1 : 0,
      data.occasions || '',
      data.primary_image,
      data.care_instructions || '',
      id
    ];
    return await db.query(sql, params);
  }

  /**
   * Delete product by ID
   */
  static async delete(id) {
    return await db.query('DELETE FROM products WHERE id = ?', [id]);
  }

  /**
   * Get products suitable for Gift Box builder
   */
  static async findForGiftBox() {
    const sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.price ASC
    `;
    try {
      return await db.query(sql);
    } catch (err) {
      console.error('[Product.findForGiftBox] Query error:', err.message);
      return [];
    }
  }
}

module.exports = Product;
