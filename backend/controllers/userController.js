const User = require("../models/User");
const escapeRegex = require("../utils/escapeRegex");

// GET /api/users?page=1&limit=10&search=khushi&role=sales
exports.getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {};

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (req.query.role) filter.role = req.query.role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ users, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/role   body: { "role": "purchase" }
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed = ["admin", "sales", "purchase", "inventory"];

    if (!allowed.includes(role)) {
      res.status(400);
      throw new Error("Invalid role");
    }

    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error("You cannot change your own role");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};