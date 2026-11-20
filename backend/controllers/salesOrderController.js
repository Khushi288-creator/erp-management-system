const SalesOrder = require("../models/SalesOrder");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const escapeRegex = require("../utils/escapeRegex");

// Kaun si status se kaun si status par ja sakte hain
const NEXT = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// GET /api/sales-orders?page=&limit=&search=&status=confirmed,shipped&invoiced=false
exports.getSalesOrders = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = {};

    if (req.query.search) {
      filter.orderNo = new RegExp(escapeRegex(req.query.search), "i");
    }
    if (req.query.status) filter.status = { $in: req.query.status.split(",") };
    if (req.query.invoiced) filter.invoiced = req.query.invoiced === "true";

    const total = await SalesOrder.countDocuments(filter);
    const items = await SalesOrder.find(filter)
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales-orders/:id
exports.getSalesOrderById = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id).populate("customer");
    if (!order) {
      res.status(404);
      throw new Error("Sales order not found");
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// POST /api/sales-orders   body: { customer, items:[{product, quantity}], notes }
exports.createSalesOrder = async (req, res, next) => {
  try {
    const { customer, items, notes } = req.body;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Customer and at least one product are required");
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      res.status(404);
      throw new Error("Customer not found");
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const line of items) {
      const qty = Number(line.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        res.status(400);
        throw new Error("Quantity must be a whole number of 1 or more");
      }
      const product = await Product.findById(line.product);
      if (!product) {
        res.status(404);
        throw new Error("One of the products was not found");
      }
      if (product.stock < qty) {
        res.status(400);
        throw new Error(`Not enough stock for ${product.title} (available: ${product.stock})`);
      }
      // price database se aata hai, user ka bheja hua nahi
      orderItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku,
        quantity: qty,
        price: product.price,
      });
      totalPrice += qty * product.price;
    }

    const count = await SalesOrder.countDocuments();
    const order = await SalesOrder.create({
      orderNo: `SO-${String(count + 1).padStart(4, "0")}`,
      customer,
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

// PUT /api/sales-orders/:id/status   body: { status }
// Stock confirm hone par kam hota hai, cancel hone par wapas aata hai
exports.updateSalesOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Sales order not found");
    }

    if (!NEXT[order.status].includes(status)) {
      res.status(400);
      throw new Error(`Cannot change status from ${order.status} to ${status}`);
    }

    if (status === "confirmed") {
      const done = [];
      for (const item of order.items) {
        const result = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (result.modifiedCount === 0) {
          // pichle kiye hue items wapas karo
          for (const d of done) {
            await Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } });
          }
          res.status(400);
          throw new Error(`Not enough stock for ${item.title}`);
        }
        done.push(item);
      }
    }

    if (status === "cancelled" && ["confirmed", "shipped"].includes(order.status)) {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};
