const Product = require("../models/Product");
const escapeRegex = require("../utils/escapeRegex");

// GET /api/products?page=1&limit=10&search=laptop&lowStock=true
exports.getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {};

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [{ title: regex }, { sku: regex }];
    }

    // stock <= reorderLevel wale products
    if (req.query.lowStock === "true") {
      filter.$expr = { $lte: ["$stock", "$reorderLevel"] };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,           // updated product wapas do
      runValidators: true, // update par bhi rules check karo
    });
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};