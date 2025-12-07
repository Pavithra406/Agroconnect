import express from "express";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

const router = express.Router();

// -----------------------------------------------------
// 🔹 EMAIL SETUP (GMAIL)
// -----------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pavitr406@gmail.com",      
    pass: "mbfo rnhk lgrf zzji"       
  }
});

// Email Sender Function
async function sendEmail(to, subject, htmlMessage) {
  try {
    await transporter.sendMail({
      from: "AgroConnect <pavitr406@gmail.com>",
      to,
      subject,
      html: htmlMessage,
    });
    console.log("Email sent to:", to);
  } catch (err) {
    console.error("Email failed:", err);
  }
}

// -----------------------------------------------------
// 🔹 DATABASE CONNECTION
// -----------------------------------------------------
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "pavi",
  database: "agroconnect"
});

// -----------------------------------------------------
// 🔹 GET ALL ORDERS
// -----------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM orders ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// -----------------------------------------------------
// 🔹 CREATE ORDER
// -----------------------------------------------------
router.post("/", async (req, res) => {
  const { name, email, phone, address, paymentMethod, cart, transactionImage } = req.body;

  try {
    const [result] = await db.execute(
      "INSERT INTO orders (name, email, phone, address, paymentMethod, cart, transactionImage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, email, phone, address, paymentMethod, JSON.stringify(cart), transactionImage, "Pending"]
    );

    res.json({ message: "Order placed successfully!", orderId: result.insertId });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

// -----------------------------------------------------
// 🔹 UPDATE ORDER (ACCEPT OR STATUS UPDATE)
// -----------------------------------------------------
router.put("/:id", async (req, res) => {
  const { status, deliveryDate } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM orders WHERE id=?", [req.params.id]);
    const order = rows[0];

    if (!order) return res.status(404).json({ message: "Order not found" });

    await db.execute(
      "UPDATE orders SET status=?, deliveryDate=? WHERE id=?",
      [status, deliveryDate, req.params.id]
    );

    // ----------------------------
    // Generate Attractive HTML Mail
    // ----------------------------
    let msg = "";

    if (status === "Accepted") {
      msg = `
      <div style="font-family: 'Poppins', sans-serif; padding: 20px; background: #f4f9f4; border-radius: 10px; color: #333;">
        <h2 style="color: #2e7d32;">🌿 Your Order is Accepted!</h2>
        <p>Hi <strong>${order.name}</strong>,</p>

        <p>Great news! 🎉 Your order <strong>#${order.id}</strong> has been <span style="color: #2e7d32; font-weight: bold;">ACCEPTED</span>.</p>

        <div style="background: #e8f5e9; padding: 15px; border-left: 5px solid #2e7d32; margin: 20px 0; border-radius: 5px;">
          <p><strong>📦 Delivery Date:</strong> ${deliveryDate}</p>
        </div>

        <p>Thank you for trusting AgroConnect! We are preparing your order with care. 🌱</p>

        <p>Warm Regards,<br><strong>AgroConnect Team</strong></p>
      </div>`;
    } else {
      msg = `
      <div style="font-family: 'Poppins', sans-serif; padding: 20px; background: #fff7e6; border-radius: 10px; color: #333;">
        <h2 style="color: #ff8f00;">🔔 Order Status Updated</h2>
        <p>Hello <strong>${order.name}</strong>,</p>

        <p>Your order <strong>#${order.id}</strong> has a new update.</p>

        <div style="background: #fff3cd; padding: 15px; border-left: 5px solid #ffb300; margin: 20px 0; border-radius: 5px;">
          <p><strong>📌 New Status:</strong> ${status}</p>
        </div>

        <p>We will keep you updated! Thank you for staying connected with <strong>AgroConnect</strong> 🌾.</p>

        <p>Warm Regards,<br><strong>AgroConnect Team</strong></p>
      </div>`;
    }

    // Send Email
    await sendEmail(order.email, `Order #${order.id} - ${status}`, msg);

    res.json({ message: "Order updated successfully" });

  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
});

// -----------------------------------------------------
// 🔹 DELETE ORDER (REJECT)
// -----------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM orders WHERE id=?", [req.params.id]);
    const order = rows[0];

    if (!order) return res.status(404).json({ message: "Order not found" });

    await db.execute("DELETE FROM orders WHERE id=?", [req.params.id]);

    // Rejection email
    const msg = `
    <div style="font-family: 'Poppins', sans-serif; padding: 20px; background: #fdecea; border-radius: 10px; color: #333;">
      <h2 style="color: #c62828;">❗ Order Rejected</h2>
      <p>Hi <strong>${order.name}</strong>,</p>

      <p>We’re sorry to inform you that your order <strong>#${order.id}</strong> has been <span style="color: #c62828; font-weight: bold;">REJECTED</span>.</p>

      <div style="background: #f8d7da; padding: 15px; border-left: 5px solid #c62828; margin: 20px 0; border-radius: 5px;">
        <p>We apologize for the inconvenience.</p>
      </div>

      <p>You may try placing another order or contact us for more details — we’re here to help 🤝.</p>

      <p>Warm Regards,<br><strong>AgroConnect Support Team</strong></p>
    </div>`;

    await sendEmail(order.email, `Order #${order.id} Rejected`, msg);

    res.json({ message: "Order deleted successfully" });

  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;
