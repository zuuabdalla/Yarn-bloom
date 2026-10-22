const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yarn_bloom',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool = null;
let isConnected = false;

try {
  pool = mysql.createPool(dbConfig);
} catch (err) {
  console.error('[Database] Failed to initialize MySQL connection pool:', err.message);
}

/**
 * Execute a parameterized SQL query
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Get a connection from the pool for transactions
 * @returns {Promise<PoolConnection>}
 */
async function getConnection() {
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }
  return await pool.getConnection();
}

/**
 * Test MySQL connection
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    console.log(`[Database] Successfully connected to MySQL database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] Warning: Could not connect to MySQL database '${dbConfig.database}': ${error.message}`);
    console.warn('[Database] Please ensure MySQL is running (e.g., via XAMPP) and the database schema is loaded via "npm run seed".');
    return false;
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  isDbConnected: () => isConnected,
  dbConfig
};
