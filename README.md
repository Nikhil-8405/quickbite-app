# 🍴 QuickBite – Food Delivery Web App

QuickBite is a full-stack food delivery management system built with **Node.js, Express, MySQL, HTML, CSS, and JavaScript**.  
It supports three roles:

- 👤 **Customer** – Browse restaurants, view menus, add items to cart, place orders, view bills, and track order history.  
- 🍴 **Restaurant** – Manage menu items, view incoming orders, update order status, and generate revenue reports.  
- 🛠️ **Admin** – Manage restaurants and users, monitor system orders, and generate system-wide reports.  

---

## 🚀 Features
- Secure authentication (Customer / Restaurant / Admin)  
- Customer cart & billing 
- Restaurant dashboard with live order management  
- Admin panel with monitoring & reports  
- MySQL database with proper relationships  

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js, Express.js  
- **Database**: MySQL 8.0  
- **Other**: bcrypt, dotenv  

---

## ▶️ Setup & Run

Follow these steps to run the project locally:

1. **Clone the repository**  
   Download the project using:  
   `git clone https://github.com/Nikhil-8405/quickbite-app.git`

2. **Navigate into the project folder**  
   Open the folder in your terminal:  
   `cd quickbite-app`

3. **Install dependencies**  
   Run:  
   `npm install`  
   This will install all required Node.js packages.

4. **Setup the database**  
   - Open MySQL.  
   - Create a database (if not already created).  
   - Import the provided `schema.sql` file into MySQL using:  
     `source schema.sql;`

5. **Start the server**  
   Run the command:  
   `node server.js`  
   If everything is correct, you should see:  
   `Server running on http://localhost:3000`

6. **Open the application**  
   Go to your browser and type:  
   `http://localhost:3000`  

---
