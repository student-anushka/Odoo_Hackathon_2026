const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ data: null, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ data: null, error: "Invalid or expired token" });
  }
};

// Usage: roleGuard(["FLEET_MANAGER", "DRIVER"])
const roleGuard = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      data: null,
      error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
    });
  }
  next();
};

module.exports = { authMiddleware, roleGuard };
