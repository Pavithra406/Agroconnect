import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    // Select id, fullname, email, phone, address, and profile_image
    const [rows] = await db.query(
      "SELECT id, fullname, email, phone, address, profile_image FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Prepend server URL to profile image if exists
    if (user.profile_image) {
      user.profile_image = `http://127.0.0.1:5000${user.profile_image}`;
    }

    res.json({ user }); // send full user object
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
