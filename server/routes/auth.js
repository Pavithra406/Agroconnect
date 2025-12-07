// server/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";

const router = express.Router();
const SECRET_KEY = "AgroConnectSecretKey";

// ------------------- MULTER CONFIG -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profiles";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ------------------- SIGNUP -------------------
router.post("/signup", upload.single("profile_image"), async (req, res) => {
  const { fullname, email, password, phone, address } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "Fullname, email, and password are required" });
  }

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO users (fullname, email, password, phone, address, profile_image) VALUES (?, ?, ?, ?, ?, ?)",
      [fullname, email, hashedPassword, phone || null, address || null, profileImagePath]
    );

    const token = jwt.sign({ id: result.insertId, email }, SECRET_KEY, { expiresIn: "7d" });

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: result.insertId,
        fullname,
        email,
        phone: phone || null,
        address: address || null,
        profile_image: profileImagePath ? `http://127.0.0.1:5000${profileImagePath}` : null,
      },
    });
  } catch (err) {
    console.error("❌ Signup ERROR:", err);
    res.status(500).json({ message: "Server error during signup", error: err.message });
  }
});

// ------------------- LOGIN -------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone || null,
        address: user.address || null,
        profile_image: user.profile_image ? `http://127.0.0.1:5000${user.profile_image}` : null,
      },
    });
  } catch (err) {
    console.error("❌ Login ERROR:", err);
    res.status(500).json({ message: "Server error during login", error: err.message });
  }
});

// ------------------- AUTH MIDDLEWARE -------------------
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Auth ERROR:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default router;
