const mongoose = require("mongoose");

const grnSchema = new mongoose.Schema(
  {
    grnNo: { type: String, unique: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: String,
        receivedQty: { type: Number, required: true, min: 1 },
      },
    ],
    notes: { type: String, trim: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GRN", grnSchema);
