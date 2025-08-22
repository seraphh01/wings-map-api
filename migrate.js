const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const CONTAINER = 'wings-map-api-db-1';
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
