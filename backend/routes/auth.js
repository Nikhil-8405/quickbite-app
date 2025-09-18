// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role, restaurant_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let restaurantId = null;
    if (role === "restaurant" && restaurant_name) {
      // Insert new restaurant and capture its ID
      const rSql = 'INSERT INTO restaurants (name, address, phone) VALUES (?, ?, ?)';
      const rValues = [restaurant_name, address, phone];
      const [rResult] = await db.promise().query(rSql, rValues);
      restaurantId = rResult.insertId;
    }

    const sql = 'INSERT INTO users (name, email, password, phone, address, role, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [name, email, hashedPassword, phone, address, role, restaurantId];
    await db.promise().query(sql, values);

    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [results] = await db.promise().query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);

    if (results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.json({
      message: 'Login successful',
      role: user.role,
      user_id: user.user_id,
      restaurant_id: user.restaurant_id || null
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

module.exports = router;
