// routes/customer.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ✅ Get customer details
router.get("/details/:userId", (req, res) => {
  const { userId } = req.params;
  db.query("SELECT name FROM users WHERE user_id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Error fetching customer details:", err);
      return res.status(500).json({ message: "Error fetching customer details" });
    }
    if (result.length === 0) return res.status(404).json({ message: "Customer not found" });
    res.json(result[0]);
  });
});

// ✅ Get all restaurants
router.get('/restaurants', (req, res) => {
  db.query('SELECT * FROM restaurants', (err, result) => {
    if (err) {
      console.error("Error fetching restaurants:", err);
      return res.status(500).json({ message: 'Error fetching restaurants' });
    }
    res.json(result);
  });
});

// ✅ Get menu of a restaurant
router.get('/menu/:restaurantId', (req, res) => {
  const { restaurantId } = req.params;
  db.query('SELECT * FROM menu_items WHERE restaurant_id = ?', [restaurantId], (err, result) => {
    if (err) {
      console.error("Error fetching menu:", err);
      return res.status(500).json({ message: 'Error fetching menu' });
    }
    res.json(result);
  });
});

// ✅ Place order
router.post('/order', (req, res) => {
  const { user_id, restaurant_id, items, total_amount } = req.body;

  if (!user_id || !restaurant_id || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const orderSql = 'INSERT INTO orders (user_id, restaurant_id, total_amount, status) VALUES (?, ?, ?, "Pending")';
  db.query(orderSql, [user_id, restaurant_id, total_amount], (err, result) => {
    if (err) {
      console.error("Error inserting order:", err);
      return res.status(500).json({ message: 'Error placing order' });
    }

    const orderId = result.insertId;
    const values = items.map(it => [orderId, it.menu_item_id, it.quantity]);

    const itemsSql = 'INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ?';
    db.query(itemsSql, [values], (err2) => {
      if (err2) {
        console.error("Error inserting order items:", err2);
        return res.status(500).json({ message: 'Error adding items' });
      }
      res.json({ message: 'Order placed', orderId });
    });
  });
});

// ✅ Get all orders for a customer
router.get('/orders/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT o.order_id, o.total_amount, o.status, o.order_time, r.name AS restaurant
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.user_id = ?
    ORDER BY o.order_time DESC
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ message: 'Error fetching orders' });
    }
    res.json(result);
  });
});

// ✅ Get detailed bill for an order
router.get('/bill/:orderId', (req, res) => {
  const { orderId } = req.params;
  const sql = `
    SELECT oi.quantity, m.name, m.price
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
    WHERE oi.order_id = ?
  `;
  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error("Error fetching bill:", err);
      return res.status(500).json({ message: 'Error fetching bill' });
    }
    res.json(result);
  });
});

module.exports = router;
