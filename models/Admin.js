const bcrypt = require('bcryptjs');
const db = require('../config/database');

class Admin {
  /**
   * Find admin by username
   */
  static async findByUsername(username) {
    const sql = `SELECT * FROM admins WHERE username = ?`;
    try {
      const rows = await db.query(sql, [username]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Admin.findByUsername] Query error:', err.message);
      return null;
    }
  }

  /**
   * Find admin by ID
   */
  static async findById(id) {
    const sql = `SELECT id, username, email, role, created_at FROM admins WHERE id = ?`;
    try {
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('[Admin.findById] Query error:', err.message);
      return null;
    }
  }

  static async countAll() {
    const rows = await db.query('SELECT COUNT(*) AS count FROM admins');
    return Number(rows[0].count);
  }

  /**
   * Create an administrator account
   */
  static async create({ username, email, passwordHash }) {
    const sql = `
      INSERT INTO admins (username, email, password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `;
    return await db.query(sql, [username, email, passwordHash]);
  }

  /**
   * Create the first superadmin while preventing concurrent initial sign-ups
   */
  static async createInitialSuperadmin({ username, email, passwordHash }) {
    const connection = await db.getConnection();
    const lockName = 'yarn_bloom_initial_admin_setup';
    let lockAcquired = false;

    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      lockAcquired = lockRows[0].acquired === 1;
      if (!lockAcquired) {
        const error = new Error('Could not acquire the initial admin setup lock.');
        error.code = 'ADMIN_SETUP_LOCK_TIMEOUT';
        throw error;
      }

      const [countRows] = await connection.query('SELECT COUNT(*) AS count FROM admins');
      if (Number(countRows[0].count) > 0) return null;

      const [result] = await connection.execute(
        `INSERT INTO admins (username, email, password_hash, role)
         VALUES (?, ?, ?, 'superadmin')`,
        [username, email, passwordHash]
      );
      return result;
    } finally {
      try {
        if (lockAcquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
      } finally {
        connection.release();
      }
    }
  }

  /**
   * Compare plain password with bcrypt hash
   */
  static async verifyPassword(plainPassword, passwordHash) {
    if (!plainPassword || !passwordHash) return false;
    return await bcrypt.compare(plainPassword, passwordHash);
  }

  /**
   * Hash a new password
   */
  static async hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
  }

  /**
   * Fetch all application settings as key-value map
   */
  static async getSettings() {
    const sql = `SELECT setting_key, setting_value, description FROM application_settings`;
    try {
      const rows = await db.query(sql);
      const settings = {};
      rows.forEach(r => {
        settings[r.setting_key] = r.setting_value;
      });
      return settings;
    } catch (err) {
      console.error('[Admin.getSettings] Query error:', err.message);
      return {};
    }
  }

  /**
   * Update or insert application setting
   */
  static async updateSetting(key, value, description = null) {
    const sql = `
      INSERT INTO application_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    return await db.query(sql, [key, value, description]);
  }
}

module.exports = Admin;
