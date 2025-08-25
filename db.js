const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    ssl: {rejectUnauthorized: false},
});

module.exports = pool;
