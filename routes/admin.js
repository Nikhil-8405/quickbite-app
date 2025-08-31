const express = require("express");
const db = require("../models/db");
const router = express.Router();

// ✅ View all restaurants
router.get("/restaurants", (req, res) => {
  db.query("SELECT * FROM restaurants", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching restaurants" });
    res.json(results);
  });
});

// ✅ View all users
router.get("/users", (req, res) => {
  db.query("SELECT user_id, name, email, role, restaurant_id FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching users" });
    res.json(results);
  });
});

// ✅ View ALL orders (with items grouped)
router.get("/orders", (req, res) => {
  const sql = `
    SELECT 
      o.order_id,
      u.name AS customer,
      r.name AS restaurant,
      o.total_amount,
      o.status,
      o.order_time,
      m.name AS item_name,
      oi.quantity
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
    ORDER BY o.order_time DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching orders" });

    const ordersMap = {};
    rows.forEach(r => {
      if (!ordersMap[r.order_id]) {
        ordersMap[r.order_id] = {
          order_id: r.order_id,
          customer: r.customer,
          restaurant: r.restaurant,
          total_amount: r.total_amount,
          status: r.status,
          order_time: r.order_time,
          items: []
        };
      }
      if (r.item_name) {
        ordersMap[r.order_id].items.push(`${r.item_name} x${r.quantity}`);
      }
    });

    res.json(Object.values(ordersMap));
  });
});

// ✅ Update order status
router.put("/orders/:orderId/status", (req, res) => {
  db.query(
    "UPDATE orders SET status=? WHERE order_id=?",
    [req.body.status, req.params.orderId],
    err => {
      if (err) return res.status(500).json({ message: "Error updating status" });
      res.json({ message: "Status updated" });
    }
  );
});

// ✅ System Report — per restaurant
router.get("/report", (req, res) => {
  const sql = `
    SELECT 
      r.name AS restaurant,
      COUNT(o.order_id) AS total_orders,
      IFNULL(CAST(SUM(o.total_amount) AS DOUBLE), 0) AS total_revenue
    FROM restaurants r
    LEFT JOIN orders o ON r.restaurant_id = o.restaurant_id
    GROUP BY r.restaurant_id, r.name
    ORDER BY total_revenue DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching report" });
    res.json(results);
  });
});

module.exports = router;
