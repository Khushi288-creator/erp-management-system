const Invoice = require("../models/Invoice");
const SalesOrder = require("../models/SalesOrder");
const escapeRegex = require("../utils/escapeRegex");

// GET /api/invoices?page=&limit=&search=&status=unpaid
exports.getInvoices = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = {};

    if (req.query.search) {
      filter.invoiceNo = new RegExp(escapeRegex(req.query.search), "i");
    }
    if (req.query.status) filter.status = req.query.status;

    const total = await Invoice.countDocuments(filter);
    const items = await Invoice.find(filter)
      .populate("customer", "name")
      .populate("salesOrder", "orderNo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("salesOrder", "orderNo");
    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices   body: { salesOrder, taxRate, dueDate }
exports.createInvoice = async (req, res, next) => {
  try {
    const { salesOrder, dueDate } = req.body;
    const taxRate = req.body.taxRate === undefined ? 18 : Number(req.body.taxRate);

    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      res.status(400);
      throw new Error("Tax rate must be between 0 and 100");
    }

    const order = await SalesOrder.findById(salesOrder);
    if (!order) {
      res.status(404);
      throw new Error("Sales order not found");
    }
    if (!["confirmed", "shipped", "delivered"].includes(order.status)) {
      res.status(400);
      throw new Error("Invoice can be created only for a confirmed, shipped or delivered order");
    }
    if (order.invoiced) {
      res.status(400);
      throw new Error("An invoice already exists for this order");
    }

    const subtotal = order.totalPrice;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const count = await Invoice.countDocuments();
    const invoice = await Invoice.create({
      invoiceNo: `INV-${String(count + 1).padStart(4, "0")}`,
      salesOrder: order._id,
      customer: order.customer,
      items: order.items.map((i) => ({
        title: i.title,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal,
      taxRate,
      taxAmount,
      total,
      dueDate: dueDate || undefined,
      createdBy: req.user._id,
    });

    order.invoiced = true;
    await order.save();

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

// PUT /api/invoices/:id/pay
exports.markInvoicePaid = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error("Invoice not found");
    }
    invoice.status = "paid";
    invoice.paidAt = new Date();
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};
