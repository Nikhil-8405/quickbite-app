// routes/restaurant.js
const express = require("express");
const router = express.Router();
const db = require("../models/db");

// ✅ Get all orders for this restaurant (with grouped items)
router.get("/orders/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;

  const sql = `
    SELECT 
      o.order_id, 
      u.name AS customer, 
      o.total_amount, 
      o.status, 
      o.order_time,
      m.name AS item_name,
      oi.quantity
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
    WHERE o.restaurant_id = ?
    ORDER BY o.order_time DESC
  `;

  db.query(sql, [restaurantId], (err, rows) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ message: "Error fetching orders" });
    }

    const ordersMap = {};
    rows.forEach(r => {
      if (!ordersMap[r.order_id]) {
        ordersMap[r.order_id] = {
          order_id: r.order_id,
          customer: r.customer,
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

    // ✅ Force sort by order_time DESC
    const orders = Object.values(ordersMap).sort((a, b) => new Date(b.order_time) - new Date(a.order_time));
    res.json(orders);
  });
});

// ✅ Update order status
router.put("/update-status/:orderId", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const sql = "UPDATE orders SET status = ? WHERE order_id = ?";
  db.query(sql, [status, orderId], (err) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ message: "Error updating status" });
    }
    res.json({ message: "Order status updated" });
  });
});

// ✅ Get restaurant details (for dashboard heading)
router.get("/details/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;
  db.query("SELECT name FROM restaurants WHERE restaurant_id = ?", [restaurantId], (err, result) => {
    if (err) {
      console.error("Error fetching restaurant details:", err);
      return res.status(500).json({ message: "Error fetching restaurant details" });
    }
    if (result.length === 0) return res.status(404).json({ message: "Restaurant not found" });
    res.json(result[0]);
  });
});

// ✅ Get menu items
router.get("/menu/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;
  db.query("SELECT * FROM menu_items WHERE restaurant_id = ?", [restaurantId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching menu" });
    res.json(result);
  });
});

// ✅ Add menu item
router.post("/add-item", (req, res) => {
  const { restaurant_id, name, description, price } = req.body;
  db.query(
    "INSERT INTO menu_items (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)",
    [restaurant_id, name, description, price],
    (err) => {
      if (err) return res.status(500).json({ message: "Error adding item" });
      res.json({ message: "Menu item added" });
    }
  );
});

// ✅ Update menu item
router.put("/update-item/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  db.query(
    "UPDATE menu_items SET name=?, description=?, price=? WHERE menu_item_id=?",
    [name, description, price, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Error updating item" });
      res.json({ message: "Menu item updated" });
    }
  );
});

// ✅ Delete menu item
router.delete("/delete-item/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM menu_items WHERE menu_item_id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting item" });
    res.json({ message: "Menu item deleted" });
  });
});

// Generate report: total orders, revenue (subtotal), commission, net earnings
router.get("/report/:restaurantId", (req, res) => {
  const { restaurantId } = req.params;
  const sql = `
    SELECT 
      COUNT(*) AS total_orders,
      IFNULL(SUM(total_amount), 0) AS total_revenue,
      IFNULL(SUM(restaurant_commission), 0) AS total_commission,
      (IFNULL(SUM(total_amount), 0) - IFNULL(SUM(restaurant_commission), 0)) AS net_earnings
    FROM orders
    WHERE restaurant_id = ?
  `;
  db.query(sql, [restaurantId], (err, result) => {
    if (err) {
      console.error("Error generating report:", err);
      return res.status(500).json({ message: "Error generating report" });
    }
    res.json(result[0]);
  });
});

module.exports = router;
