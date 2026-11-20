const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const escapeRegex = require("../utils/escapeRegex");

const NEXT = {
  pending: ["ordered", "cancelled"],
  ordered: ["cancelled"], // sirf tab jab kuch receive nahi hua
  partially_received: [],
  received: [],
  cancelled: [],
};

// GET /api/purchase-orders?page=&limit=&search=&status=ordered,partially_received
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = {};

    if (req.query.search) {
      filter.orderNo = new RegExp(escapeRegex(req.query.search), "i");
    }
    if (req.query.status) filter.status = { $in: req.query.status.split(",") };

    const total = await PurchaseOrder.countDocuments(filter);
    const items = await PurchaseOrder.find(filter)
      .populate("supplier", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// GET /api/purchase-orders/:id
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id).populate("supplier");
    if (!order) {
      res.status(404);
      throw new Error("Purchase order not found");
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// POST /api/purchase-orders   body: { supplier, items:[{product, quantity, price}], notes }
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items, notes } = req.body;

    if (!supplier || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Supplier and at least one product are required");
    }

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const line of items) {
      const qty = Number(line.quantity);
      const price = Number(line.price);
      if (!Number.isInteger(qty) || qty < 1) {
        res.status(400);
        throw new Error("Quantity must be a whole number of 1 or more");
      }
      if (Number.isNaN(price) || price < 0) {
        res.status(400);
        throw new Error("Price cannot be negative");
      }
      const product = await Product.findById(line.product);
      if (!product) {
        res.status(404);
        throw new Error("One of the products was not found");
      }
      orderItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku,
        quantity: qty,
        price,
      });
      totalPrice += qty * price;
    }

    const count = await PurchaseOrder.countDocuments();
    const order = await PurchaseOrder.create({
      orderNo: `PO-${String(count + 1).padStart(4, "0")}`,
      supplier,
      items: orderItems,
      totalPrice,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// PUT /api/purchase-orders/:id/status   body: { status }
exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Purchase order not found");
    }

    if (!NEXT[order.status].includes(status)) {
      res.status(400);
      throw new Error(`Cannot change status from ${order.status} to ${status}`);
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};
