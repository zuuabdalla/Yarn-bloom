const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrationsDirectory = path.join(__dirname, 'migrations');

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );
  return Number(rows[0].count) > 0;
}

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yarn_bloom',
    charset: 'utf8mb4'
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedRows] = await connection.query('SELECT name FROM schema_migrations');
    const appliedMigrations = new Set(appliedRows.map((row) => row.name));
    const migrationFiles = fs.readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
      const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
      let stockQuantityAlreadyExisted = false;

      for (const statement of statements) {
        if (file === '003-product-inventory.sql' && statement.startsWith('ALTER TABLE `products`')) {
          stockQuantityAlreadyExisted = await columnExists(connection, 'products', 'stock_quantity');
          if (!stockQuantityAlreadyExisted) await connection.query(statement);
          continue;
        }

        if (
          file === '003-product-inventory.sql' &&
          stockQuantityAlreadyExisted &&
          statement.startsWith('UPDATE `products`')
        ) {
          continue;
        }

        await connection.query(statement);
      }

      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      console.log(`[Database] Applied migration: ${file}`);
    }

    console.log('[Database] Migrations are up to date.');
  } finally {
    await connection.end();
  }
}

runMigrations().catch((error) => {
  console.error('[Database] Migration failed:', error.message);
  process.exitCode = 1;
});
