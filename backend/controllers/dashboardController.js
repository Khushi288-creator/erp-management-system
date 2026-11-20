const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const SalesOrder = require("../models/SalesOrder");
const PurchaseOrder = require("../models/PurchaseOrder");
const Invoice = require("../models/Invoice");

const statusCounts = async (Model) => {
  const rows = await Model.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]);
  return rows.map((r) => ({ name: r._id, value: r.value }));
};

const monthlyTotals = async (Model, excluded, start) => {
  return Model.aggregate([
    { $match: { status: { $nin: excluded }, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
        total: { $sum: "$totalPrice" },
      },
    },
  ]);
};

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      products, customers, suppliers, salesOrders, purchaseOrders,
      lowStock, pendingSales, pendingPurchase, unpaidInvoices,
      revenueAgg, unpaidAgg, inventoryAgg,
      salesMonthly, purchaseMonthly, salesStatus, purchaseStatus,
      topProducts, lowStockItems, recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),
      SalesOrder.countDocuments(),
      PurchaseOrder.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ["$stock", "$reorderLevel"] } }),
      SalesOrder.countDocuments({ status: "pending" }),
      PurchaseOrder.countDocuments({ status: { $in: ["pending", "ordered", "partially_received"] } }),
      Invoice.countDocuments({ status: "unpaid" }),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Invoice.aggregate([
        { $match: { status: "unpaid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ["$stock", "$price"] } } } },
      ]),
      monthlyTotals(SalesOrder, ["pending", "cancelled"], start),
      monthlyTotals(PurchaseOrder, ["pending", "cancelled"], start),
      statusCounts(SalesOrder),
      statusCounts(PurchaseOrder),
      SalesOrder.aggregate([
        { $match: { status: { $nin: ["pending", "cancelled"] } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.title", qty: { $sum: "$items.quantity" } } },
        { $sort: { qty: -1 } },
        { $limit: 5 },
      ]),
      Product.find({ $expr: { $lte: ["$stock", "$reorderLevel"] } })
        .sort({ stock: 1 })
        .limit(6)
        .select("title sku stock reorderLevel"),
      SalesOrder.find().populate("customer", "name").sort({ createdAt: -1 }).limit(5),
    ]);

    // pichle 6 mahine, jisme koi data nahi us mahine ka 0
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const find = (rows) =>
        rows.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1)?.total || 0;
      monthly.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        sales: find(salesMonthly),
        purchases: find(purchaseMonthly),
      });
    }

    res.json({
      counts: {
        products, customers, suppliers, salesOrders, purchaseOrders,
        lowStock, pendingSales, pendingPurchase, unpaidInvoices,
      },
      revenue: revenueAgg[0]?.total || 0,
      unpaidAmount: unpaidAgg[0]?.total || 0,
      inventoryValue: inventoryAgg[0]?.total || 0,
      monthly,
      salesStatus,
      purchaseStatus,
      topProducts: topProducts.map((t) => ({ name: t._id, qty: t.qty })),
      lowStockItems,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};
