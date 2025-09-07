DROP DATABASE IF EXISTS quickbite;
CREATE DATABASE quickbite;
USE quickbite;

CREATE TABLE restaurants (
  restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL
);

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(200),
  password VARCHAR(255),
  role ENUM('customer','restaurant','admin') NOT NULL,
  restaurant_id INT DEFAULT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

CREATE TABLE menu_items (
  menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT,
  name VARCHAR(100),
  description VARCHAR(255),
  price DECIMAL(10,2),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  restaurant_id INT,
  total_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00, 
  restaurant_commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending','Accepted','Preparing','Delivered') DEFAULT 'Pending',
  order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  menu_item_id INT,
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(menu_item_id)
);

-- Insert default Admin (password = admin123)
INSERT INTO users (name, email, phone, address, password, role)
VALUES ('System Admin','admin@quickbite.com','9999999999','HQ',
'$2b$10$ElP0Qq5nKXOMMvGAJYQL/OHberut84orSFuYF5BBYo/KECYTgLJAa','admin');
