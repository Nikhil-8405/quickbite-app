// routes/customer.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// helper to round to 2 decimals
const round2 = (n) => Math.round(n * 100) / 100;

// ---- Get all restaurants
router.get('/restaurants', (req, res) => {
  db.query('SELECT restaurant_id, name, address FROM restaurants', (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// ---- Get menu for a restaurant
router.get('/menu/:restaurantId', (req, res) => {
  const { restaurantId } = req.params;
  db.query(
    'SELECT menu_item_id, name, description, price FROM menu_items WHERE restaurant_id = ?',
    [restaurantId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }
  );
});

// ---- Place order (server calculates subtotal + 5% platform fee)
router.post('/order', async (req, res) => {
  try {
    const { user_id, restaurant_id, items } = req.body;

    if (!user_id || !restaurant_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Validate user exists & is a customer
    const [userRows] = await db.promise().query(
      'SELECT user_id FROM users WHERE user_id = ? AND role = "customer"',
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid customer user_id' });
    }

    // Get menu prices for given items
    const ids = items.map(i => i.menu_item_id);
    const [menuRows] = await db.promise().query(
      `SELECT menu_item_id, price, restaurant_id FROM menu_items WHERE menu_item_id IN (${ids.map(()=>'?').join(',')})`,
      ids
    );

    // Validate items exist and belong to the same restaurant
    const priceMap = new Map();
    for (const row of menuRows) {
      if (row.restaurant_id !== Number(restaurant_id)) {
        return res.status(400).json({ message: 'One or more items do not belong to this restaurant' });
      }
      priceMap.set(row.menu_item_id, Number(row.price));
    }
    for (const it of items) {
      if (!priceMap.has(it.menu_item_id)) {
        return res.status(400).json({ message: `Invalid menu_item_id: ${it.menu_item_id}` });
      }
    }

    // Calculate subtotal from DB prices
    let subtotal = 0;
    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      const price = priceMap.get(it.menu_item_id);
      subtotal += price * qty;
    }
    subtotal = round2(subtotal);

    // 5% platform fee
    const platform_fee = round2(subtotal * 0.05);

    // Insert order (store subtotal + platform_fee)
    const [orderResult] = await db.promise().query(
      'INSERT INTO orders (user_id, restaurant_id, total_amount, platform_fee, status) VALUES (?, ?, ?, ?, "Pending")',
      [user_id, restaurant_id, subtotal, platform_fee]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    const values = items.map(it => [orderId, it.menu_item_id, Number(it.quantity) || 0]);
    await db.promise().query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ?',
      [values]
    );

    res.json({
      message: 'Order placed',
      order_id: orderId,
      subtotal,
      platform_fee
    });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Get a customer’s orders (header rows)
router.get('/orders/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT o.order_id, r.name AS restaurant, o.total_amount, o.platform_fee, o.status, o.order_time
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.user_id = ?
    ORDER BY o.order_time DESC
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// ---- Get bill line items for an order
router.get('/bill/:orderId', (req, res) => {
  const { orderId } = req.params;
  const sql = `
    SELECT mi.name, mi.price, oi.quantity
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
    WHERE oi.order_id = ?
  `;
  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

// ---- NEW: Get order header (subtotal + platform fee) for bill
router.get('/order/:orderId', (req, res) => {
  const { orderId } = req.params;
  const sql = `
    SELECT o.order_id, o.total_amount, o.platform_fee, o.status, o.order_time, r.name AS restaurant
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.order_id = ?
  `;
  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json(rows[0]);
  });
});

module.exports = router;
