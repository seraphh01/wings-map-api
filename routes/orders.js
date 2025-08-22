const { authenticateToken, requireAdmin } = require('../middleware/auth');
const pool = require('../db');
const express = require('express');
const router = express.Router();

// Place an order (as user or guest)
router.post('/', async (req, res) => {
  const { email, items, shipping_address } = req.body;
  try {
    // Try to find user by email
    let userId = null;
    if (email) {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userRes.rows.length) userId = userRes.rows[0].id;
    }
    const result = await pool.query(
      'INSERT INTO orders (user_id, email, shipping_address, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, email, shipping_address, 'pending']
    );
    const order = result.rows[0];
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [order.id, item.product_id, item.quantity]
      );
      // Decrement inventory for each product
      await pool.query(
        'UPDATE products SET inventory = inventory - $1 WHERE id = $2 AND inventory >= $1',
        [item.quantity, item.product_id]
      );
    }
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get orders for a user or guest, or all orders if admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user && req.user.is_admin) {
      result = await pool.query('SELECT * FROM orders order BY created_at');
    } else if (req.user && req.user.email) {
      result = await pool.query('SELECT * FROM orders WHERE email = $1 order BY created_at', [req.user.email]);
    } else if (req.query.email) {
      result = await pool.query('SELECT * FROM orders WHERE email = $1 order BY created_at', [req.query.email]);
    } else {
      return res.status(400).json({ error: 'email required' });
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Track order by order id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order_items = await pool.query(
      'SELECT p.name, op.quantity, p.price FROM order_items op JOIN products p ON op.product_id = p.id WHERE op.order_id = $1',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    result.rows[0].items = order_items.rows;
    console.log(order_items.rows);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});



module.exports = router;
