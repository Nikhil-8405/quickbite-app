// routes/customer.js
const express = require("express");
const db = require("../models/db");
const router = express.Router();

// 🛒 Place order (server calculates fees & commission)
router.post("/order", async (req, res) => {
  try {
    const { user_id, restaurant_id, items } = req.body;

    if (!user_id || !restaurant_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // validate user exists & is customer
    const [userRows] = await db.promise().query(
      "SELECT user_id FROM users WHERE user_id=? AND role='customer'",
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(400).json({ message: "Invalid customer user_id" });
    }

    // fetch menu items
    const ids = items.map(i => i.menu_item_id);
    const placeholders = ids.map(() => "?").join(",");
    const [menuRows] = await db.promise().query(
      `SELECT menu_item_id, price, restaurant_id FROM menu_items WHERE menu_item_id IN (${placeholders})`,
      ids
    );

    const priceMap = new Map();
    for (const mr of menuRows) {
      if (mr.restaurant_id !== Number(restaurant_id)) {
        return res.status(400).json({ message: "Item does not belong to this restaurant" });
      }
      priceMap.set(mr.menu_item_id, Number(mr.price));
    }

    const round2 = v => Math.round(v * 100) / 100;

    // subtotal
    let subtotal = 0;
    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      const price = priceMap.get(it.menu_item_id);
      subtotal += price * qty;
    }
    subtotal = round2(subtotal);

    const platform_fee = round2(subtotal * 0.05);
    const restaurant_commission = round2(subtotal * 0.10);

    // insert order
    const [orderResult] = await db.promise().query(
      "INSERT INTO orders (user_id, restaurant_id, total_amount, platform_fee, restaurant_commission, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [user_id, restaurant_id, subtotal, platform_fee, restaurant_commission]
    );
    const orderId = orderResult.insertId;

    // insert items
    const values = items.map(it => [orderId, it.menu_item_id, Number(it.quantity) || 0]);
    await db.promise().query(
      "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ?",
      [values]
    );

    res.json({ message: "Order placed", order_id: orderId, subtotal, platform_fee, restaurant_commission });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 Order header (for bill)
router.get("/order/:orderId", (req, res) => {
  const { orderId } = req.params;
  const sql = `
    SELECT o.order_id, o.total_amount, o.platform_fee, o.restaurant_commission, o.status, o.order_time, r.name AS restaurant
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.order_id = ?
  `;
  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json(rows[0]);
  });
});

// 🔍 Order items (bill details)
router.get("/bill/:orderId", (req, res) => {
  const { orderId } = req.params;
  const sql = `
    SELECT m.name, m.price, oi.quantity
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
    WHERE oi.order_id = ?
  `;
  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

// ✅ Fetch restaurants list
router.get("/restaurants", (req, res) => {
  db.query("SELECT * FROM restaurants", (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching restaurants" });
    res.json(rows);
  });
});

// ✅ Fetch menu of a restaurant
router.get("/menu/:restaurantId", (req, res) => {
  db.query("SELECT * FROM menu_items WHERE restaurant_id=?", [req.params.restaurantId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching menu" });
    res.json(rows);
  });
});

// ✅ Fetch customer orders
router.get("/orders/:userId", (req, res) => {
  const sql = `
    SELECT o.order_id, o.total_amount, o.status, o.order_time, r.name AS restaurant
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.user_id = ?
    ORDER BY o.order_time DESC
  `;
  db.query(sql, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching orders" });
    res.json(rows);
  });
});

// ✅ Fetch customer details
router.get("/details/:userId", (req, res) => {
  db.query("SELECT name FROM users WHERE user_id=?", [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching user" });
    if (rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  });
});

module.exports = router;
