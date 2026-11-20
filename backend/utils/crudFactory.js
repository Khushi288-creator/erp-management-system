const escapeRegex = require("./escapeRegex");

// Customers aur Suppliers dono ka CRUD ek hi jagah se banta hai
module.exports = (Model, searchFields, label) => ({
  list: async (req, res, next) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const filter = {};

      if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), "i");
        filter.$or = searchFields.map((f) => ({ [f]: regex }));
      }

      const total = await Model.countDocuments(filter);
      const items = await Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({ items, page, pages: Math.ceil(total / limit), total });
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) {
        res.status(404);
        throw new Error(`${label} not found`);
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) {
        res.status(404);
        throw new Error(`${label} not found`);
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) {
        res.status(404);
        throw new Error(`${label} not found`);
      }
      res.json({ message: `${label} deleted` });
    } catch (error) {
      next(error);
    }
  },
});
