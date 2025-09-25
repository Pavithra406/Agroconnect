const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",         // 👉 your MySQL username
  password: "pavi", // 👉 replace with your MySQL password
  database: "refreshment_shop"
});

// Test DB Connection
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

// ✅ POST Route to insert customer
app.post("/add-customer", (req, res) => {
  const { fullName, phoneNumber, email, snacks, address } = req.body;

  // ✅ Always use placeholders to avoid SQL injection
  const sql = `
    INSERT INTO customers (fullName, phoneNumber, email, snacks, address)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [fullName, phoneNumber, email, snacks, address], (err, result) => {
    if (err) {
      console.error("❌ Error inserting data:", err);
      return res.status(500).send("Database insert failed!");
    }
    res.send("✅ Customer details saved successfully!");
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
