const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
      required: true,
      unique: true, // one sales order = one invoice
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [
      {
        _id: false,
        title: String,
        sku: String,
        quantity: Number,
        price: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    dueDate: Date,
    paidAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
