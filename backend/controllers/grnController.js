const GRN = require("../models/GRN");
const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");
const escapeRegex = require("../utils/escapeRegex");

// GET /api/grn
exports.getGrns = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const filter = {};

    if (req.query.search) {
      filter.grnNo = new RegExp(escapeRegex(req.query.search), "i");
    }

    const total = await GRN.countDocuments(filter);
    const items = await GRN.find(filter)
      .populate({ path: "purchaseOrder", select: "orderNo supplier", populate: { path: "supplier", select: "name" } })
      .populate("receivedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

// GET /api/grn/:id
exports.getGrnById = async (req, res, next) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate({ path: "purchaseOrder", populate: { path: "supplier", select: "name" } })
      .populate("receivedBy", "name");
    if (!grn) {
      res.status(404);
      throw new Error("GRN not found");
    }
    res.json(grn);
  } catch (error) {
    next(error);
  }
};

// POST /api/grn   body: { purchaseOrder, items:[{product, receivedQty}], notes }
// Is se: stock badhta hai + Purchase Order ka status update hota hai
exports.createGrn = async (req, res, next) => {
  try {
    const { purchaseOrder, items, notes } = req.body;

    const po = await PurchaseOrder.findById(purchaseOrder);
    if (!po) {
      res.status(404);
      throw new Error("Purchase order not found");
    }
    if (!["ordered", "partially_received"].includes(po.status)) {
      res.status(400);
      throw new Error(`Goods cannot be received for a ${po.status.replace("_", " ")} order`);
    }

    const lines = (items || []).filter((i) => Number(i.receivedQty) > 0);
    if (lines.length === 0) {
      res.status(400);
      throw new Error("Enter received quantity for at least one product");
    }

    // pehle sab check karo, phir hi database badlo
    const grnItems = [];
    for (const line of lines) {
      const qty = Number(line.receivedQty);
      const poItem = po.items.find((i) => String(i.product) === String(line.product));
      if (!poItem) {
        res.status(400);
        throw new Error("A product in the GRN is not part of this purchase order");
      }
      if (!Number.isInteger(qty)) {
        res.status(400);
        throw new Error("Received quantity must be a whole number");
      }
      const remaining = poItem.quantity - poItem.receivedQty;
      if (qty > remaining) {
        res.status(400);
        throw new Error(`${poItem.title}: only ${remaining} left to receive`);
      }
      grnItems.push({ product: poItem.product, title: poItem.title, receivedQty: qty });
    }

    for (const g of grnItems) {
      await Product.updateOne({ _id: g.product }, { $inc: { stock: g.receivedQty } });
      const poItem = po.items.find((i) => String(i.product) === String(g.product));
      poItem.receivedQty += g.receivedQty;
    }

    const allReceived = po.items.every((i) => i.receivedQty >= i.quantity);
    po.status = allReceived ? "received" : "partially_received";
    await po.save();

    const count = await GRN.countDocuments();
    const grn = await GRN.create({
      grnNo: `GRN-${String(count + 1).padStart(4, "0")}`,
      purchaseOrder: po._id,
      items: grnItems,
      notes,
      receivedBy: req.user._id,
    });

    res.status(201).json(grn);
  } catch (error) {
    next(error);
  }
};
