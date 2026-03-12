# AgroConnect

**A Digital Platform Connecting Farmers and Consumers**

## 📌 Project Overview

AgroConnect is a web-based agricultural e-commerce platform designed to connect farmers directly with consumers. The system eliminates intermediaries in the agricultural supply chain and enables transparent trading of agricultural products.

The platform allows farmers to list their produce online while consumers can browse products, view market prices, and place orders directly from farmers.

---

# 🎯 Objectives

* Enable **direct digital interaction between farmers and consumers**
* Provide **real-time agricultural market price information**
* Reduce dependency on **middlemen**
* Ensure **secure online transactions**
* Create a **scalable agriculture marketplace**

---

# 🚜 Problem Statement

Traditional agricultural trade involves multiple intermediaries which leads to:

* Lower profits for farmers
* Higher prices for consumers
* Lack of transparency in pricing
* Limited access to direct buyers

AgroConnect solves these problems by building a **direct farmer-to-consumer digital marketplace**.

---

# 🧠 System Architecture

## Frontend

Provides the user interface.

**Technologies**

* HTML
* CSS
* JavaScript

**Features**

* User Registration & Login
* Product Browsing
* Product Listing
* Order Placement
* Order Tracking

---

## Backend

Handles server-side logic and APIs.

**Technologies**

* Node.js
* Express.js

**Responsibilities**

* Authentication
* Product management
* Order management
* API communication

---

## Database

Stores application data.

**Technology**

* MySQL

**Data Stored**

* Users
* Products
* Orders
* Market prices

---

# ⚙️ Core Features

## 👨‍🌾 Farmer

* Register account
* Add products
* Set price and quantity
* Manage product listings
* View orders

## 🛒 Consumer

* Register and login
* Browse products
* View product details
* Add items to cart
* Place orders
* Track order status

---

# 🔐 Security

* Secure authentication
* Backend API validation
* Database access control

---

# 🌟 Advantages

* Direct farmer–consumer connection
* Better price transparency
* Reduced middlemen
* Efficient digital trading platform
* Scalable architecture

---

# 📈 Future Enhancements

* Payment gateway integration
* Mobile application
* AI crop recommendation
* Demand prediction analytics
* Delivery tracking system

---

# 💻 Tech Stack

| Layer    | Technology            |
| -------- | --------------------- |
| Frontend | HTML, CSS, JavaScript |
| Backend  | Node.js, Express.js   |
| Database | MySQL                 |
| Tools    | VS Code, Git          |

---

# 🚀 How to Run the Project

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/agroconnect.git
```

---

## 2️⃣ Navigate to the Project Folder

```bash
cd agroconnect
```

---

## 3️⃣ Install Backend Dependencies

```bash
npm install
```

---

## 4️⃣ Setup MySQL Database

1. Open **MySQL Workbench / phpMyAdmin**
2. Create a database

```sql
CREATE DATABASE agroconnect;
```

3. Import the provided SQL file (if available).

---

## 5️⃣ Configure Database Connection

Update the database configuration file:

```js
const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "agroconnect"
});
```

---

## 6️⃣ Start the Backend Server

```bash
node server.js
```

or

```bash
npm start
```

Server will run on:

```
http://localhost:3000
```

---

## 7️⃣ Run the Frontend

Open the frontend folder and launch:

```
index.html
```

or run using **Live Server in VS Code**.

---

# 📂 Project Structure

```
AgroConnect
│
├── frontend
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── css
│   └── js
│
├── backend
│   ├── server.js
│   ├── routes
│   └── controllers
│
├── database
│   └── agroconnect.sql
│
└── README.md
```

---

# 👩‍💻 Author

**Pavithra Thangadurai**
B.Tech – Information Technology

---

# 📜 License

This project is developed for **academic and educational purposes**.
