const express = require('express');
const pool = require('../db');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/analytics/summary
router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total sales, total orders, total products, total inventory
    const [salesRes, ordersRes, productsRes, inventoryRes] = await Promise.all([
      pool.query(`SELECT SUM(oi.quantity * p.price) AS total_sales FROM order_items oi JOIN products p ON oi.product_id = p.id`),
      pool.query('SELECT COUNT(*) AS total_orders FROM orders'),
      pool.query('SELECT COUNT(*) AS total_products FROM products'),
      pool.query('SELECT SUM(inventory) AS total_inventory FROM products'),
    ]);
    res.json({
      total_sales: Number(salesRes.rows[0].total_sales) || 0,
      total_orders: Number(ordersRes.rows[0].total_orders) || 0,
      total_products: Number(productsRes.rows[0].total_products) || 0,
      total_inventory: Number(inventoryRes.rows[0].total_inventory) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/sales-by-product
router.get('/sales-by-product', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, SUM(oi.quantity) AS units_sold, SUM(oi.quantity * p.price) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales by product' });
  }
});

// GET /api/analytics/sales-over-time?interval=day|month
router.get('/sales-over-time', authenticateToken, requireAdmin, async (req, res) => {
  const interval = req.query.interval === 'month' ? 'month' : 'day';
  try {
    const result = await pool.query(`
      SELECT date_trunc($1, o.created_at) AS period, SUM(oi.quantity * p.price) AS revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY period
      ORDER BY period
    `, [interval]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales over time' });
  }
});

// GET /api/analytics/low-inventory?threshold=5
router.get('/low-inventory', authenticateToken, requireAdmin, async (req, res) => {
  const threshold = Number(req.query.threshold) || 5;
  try {
    const result = await pool.query('SELECT * FROM products WHERE inventory <= $1 ORDER BY inventory ASC', [threshold]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low inventory' });
  }
});

module.exports = router;
