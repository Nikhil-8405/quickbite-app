# 🍴 QuickBite – Food Delivery Web App

QuickBite is a full-stack food delivery platform built with **React + Tailwind CSS** (frontend) and **Node.js + Express + MySQL** (backend).  
It provides separate dashboards for **customers**, **restaurants**, and **admin**.

---

## 🚀 Features

### 🔐 Authentication
- Register & login with roles: Customer, Restaurant, Admin
- Role-based access and redirects
- Secure session handling

### 👤 Customer
- Browse restaurant 
- View menus
- Add items to cart & place orders
- View past orders and bills

### 🏢 Restaurant
- Manage menus (add, update, delete items)
- View and process customer orders
- Track restaurant performance

### 👑 Admin
- Manage users & restaurants
- View all orders with status updates
- System-wide reports 
- Revenue, commission, and fee analytics

---

## 🛠️ Tech Stack
- **Frontend**: React + Tailwind CSS + Vite 
- **Backend**: Node.js + Express.js  
- **Database**: MySQL 8.0  

---

## ▶️ Setup & Run

Follow these steps to run the project locally:

1. **Clone the repository**
   Download the project using:
   `git clone https://github.com/your-username/quickbite.git`

2. **Navigate into the project folder**
   Open the folder in your terminal:
   `cd quickbite-app`

3. **Backend setup**

   * Navigate to the backend folder:
     `cd backend`
   * Install dependencies:
     `npm install`
   * Create a `.env` file in the `backend/` directory with the following content:

     ```
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=yourpassword
     DB_NAME=quickbite
     ```
   * Set up the MySQL database:

     * Open MySQL.
     * Create the database (if not already created).
     * Import the provided `schema.sql` file using:
       `source schema.sql;`
   * Start the backend server:
     `node server.js`
     If everything is correct, you should see:
     `Server running on http://localhost:3000`

4. **Frontend setup**

   * Navigate to the frontend folder:
     `cd ../frontend`
   * Install dependencies:
     `npm install`
   * Start the frontend development server:
     `npm run dev`
     If everything is correct, the frontend will run on:
     `http://localhost:5173`

---
