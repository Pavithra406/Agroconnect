// server/middleware/auth.js
import jwt from "jsonwebtoken";

const SECRET_KEY = "AgroConnectSecretKey"; // Must match your auth routes

/**
 * Middleware to protect routes
 * Checks for a valid JWT token in the Authorization header
 */
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ Auth middleware: No token provided");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Add decoded payload (id, email) to req.user
    next(); // Proceed to next middleware or route
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
}
