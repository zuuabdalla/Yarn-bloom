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

    if (typeof search === 'string' && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.detailed_description LIKE ? OR p.available_colors LIKE ? OR p.occasions LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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

    return db.query(sql, params);
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

    if (typeof search === 'string' && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.detailed_description LIKE ? OR p.available_colors LIKE ? OR p.occasions LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    const rows = await db.query(sql, params);
    return rows[0] ? rows[0].total : 0;
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
    return db.query(sql, [parseInt(limit, 10)]);
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
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
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
    const rows = await db.query(sql, [slug]);
    return rows[0] || null;
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
    return db.query(sql, [categoryId, currentProductId, parseInt(limit, 10)]);
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
    return db.query(sql, [productId]);
  }

  static async findActiveByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const sql = `
      SELECT id, name, slug, price, stock_status, estimated_production_days,
        available_colors, is_customizable
      FROM products
      WHERE is_active = 1 AND id IN (${placeholders})
    `;
    return db.query(sql, ids);
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(sql, params);
      const galleryImages = [data.primary_image, ...(data.gallery_images || [])]
        .filter((imageUrl, index, imageUrls) => imageUrl && imageUrls.indexOf(imageUrl) === index);

      for (const [index, imageUrl] of galleryImages.entries()) {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, imageUrl, data.name, index === 0 ? 1 : 0, index]
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [updateResult] = await connection.execute(sql, params);

      const galleryImages = [data.primary_image, ...(data.gallery_images || [])]
        .filter((imageUrl, index, imageUrls) => imageUrl && imageUrls.indexOf(imageUrl) === index);
      await connection.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [id]);

      for (const [index, imageUrl] of galleryImages.entries()) {
        const [existingImages] = await connection.execute(
          'SELECT id FROM product_images WHERE product_id = ? AND image_url = ? LIMIT 1',
          [id, imageUrl]
        );
        if (existingImages.length) {
          await connection.execute(
            'UPDATE product_images SET is_primary = ?, sort_order = ? WHERE id = ?',
            [index === 0 ? 1 : 0, index, existingImages[0].id]
          );
        } else {
          await connection.execute(
            `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [id, imageUrl, data.name, index === 0 ? 1 : 0, index]
          );
        }
      }

      await connection.commit();
      return updateResult;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
    return db.query(sql);
  }
}

module.exports = Product;
