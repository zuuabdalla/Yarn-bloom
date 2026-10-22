const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yarn_bloom',
    multipleStatements: true,
    charset: 'utf8mb4'
  };

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: 'utf8mb4',
    multipleStatements: true
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.query(`USE \`${config.database}\`;`);

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  await connection.query(schemaSql + '\n' + seedSql);
  console.log(`Database '${config.database}' initialized and seeded successfully.`);

  await connection.end();
}

seedDatabase().catch((error) => {
  console.error('Error seeding database:', error.message);
  process.exit(1);
});
