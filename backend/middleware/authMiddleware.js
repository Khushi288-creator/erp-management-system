const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. protect: only logged-in users can pass
exports.protect = async (req, res, next) => {
  try {
    let token;
    const header = req.headers.authorization;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error("User no longer exists");
    }

    next();
  } catch (error) {
    if (res.statusCode === 200) res.status(401);
    next(error);
  }
};

// 2. authorize: only given roles can pass
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role '${req.user.role}' is not allowed here`));
    }
    next();
  };
};