const jwt = require("jsonwebtoken");
const SECRET_KEY = "AgroConnectSecretKey"; // same as your server key

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.split(" ")[1]; // expecting "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Token missing" });

    // verify JWT
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
