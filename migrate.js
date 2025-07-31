const pool = require('./db');

async function migrate() {
  try {
    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        guest_email VARCHAR(255),
        shipping_address TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Order items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL
      );
    `);
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const CONTAINER = 'wings-mag-db-1';
const DB_USER = 'wingsmag';
const DB_NAME = 'wingsmag';

// Ensure migration tracking table exists
const ensureMigrationsTable = `docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE TABLE IF NOT EXISTS migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT now());"`;
execSync(ensureMigrationsTable, { stdio: 'inherit' });

// Get applied migrations
const getApplied = `docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT filename FROM migrations ORDER BY filename;"`;
const appliedRaw = execSync(getApplied).toString();
const applied = new Set(appliedRaw.split('\n').map(s => s.trim()).filter(Boolean));

// Find migration files
const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`Skipping already applied migration: ${file}`);
    continue;
  }
  console.log(`Applying migration: ${file}`);
  execSync(`docker cp "${path.join(MIGRATIONS_DIR, file)}" ${CONTAINER}:/tmp/${file}`, { stdio: 'inherit' });
  execSync(`docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -f /tmp/${file}`, { stdio: 'inherit' });
  execSync(`docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "INSERT INTO migrations (filename) VALUES ('${file}') ON CONFLICT DO NOTHING;"`, { stdio: 'inherit' });
}
