const db = require('../config/database');

class AdminAccessRequest {
  static async create({ username, email, passwordHash }) {
    return db.query(
      `INSERT INTO admin_access_requests (username, email, password_hash)
       VALUES (?, ?, ?)`,
      [username, email, passwordHash]
    );
  }

  static async findAll({ status = null, limit = 50 } = {}) {
    let sql = `
      SELECT id, username, email, status, created_at, reviewed_at
      FROM admin_access_requests
    `;
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Number.parseInt(limit, 10));
    return db.query(sql, params);
  }

  static async countPending() {
    const rows = await db.query(
      `SELECT COUNT(*) AS count
       FROM admin_access_requests
       WHERE status = 'pending'`
    );
    return Number(rows[0].count);
  }

  static async approveAndCreateAdmin(id, reviewerId) {
    const connection = await db.getConnection();
    let transactionStarted = false;
    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [requests] = await connection.execute(
        `SELECT id, username, email, password_hash, status
         FROM admin_access_requests
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );
      const accessRequest = requests[0];
      if (!accessRequest || accessRequest.status !== 'pending') {
        const error = new Error('This admin access request is no longer pending.');
        error.code = 'ADMIN_ACCESS_REQUEST_NOT_PENDING';
        throw error;
      }

      const [adminResult] = await connection.execute(
        `INSERT INTO admins (username, email, password_hash, role)
         VALUES (?, ?, ?, 'admin')`,
        [accessRequest.username, accessRequest.email, accessRequest.password_hash]
      );
      await connection.execute(
        `UPDATE admin_access_requests
         SET status = 'approved', password_hash = NULL, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reviewerId, id]
      );
      await connection.commit();
      transactionStarted = false;
      return adminResult.insertId;
    } catch (error) {
      if (transactionStarted) await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async reject(id, reviewerId) {
    const result = await db.query(
      `UPDATE admin_access_requests
       SET status = 'rejected', password_hash = NULL, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [reviewerId, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AdminAccessRequest;
