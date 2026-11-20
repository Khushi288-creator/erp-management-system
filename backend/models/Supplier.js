const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    contact: { type: String, trim: true }, // phone number
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
