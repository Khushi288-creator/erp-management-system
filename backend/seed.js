require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Supplier = require("./models/Supplier");

const users = [
  { name: "Admin", email: "admin@erp.com", password: "Admin@123", role: "admin" },
  { name: "Sales User", email: "sales@erp.com", password: "Sales@123", role: "sales" },
  { name: "Purchase User", email: "purchase@erp.com", password: "Purchase@123", role: "purchase" },
  { name: "Inventory User", email: "inventory@erp.com", password: "Inventory@123", role: "inventory" },
];

const products = [
  { title: "Laptop", sku: "LAP-001", price: 55000, stock: 25, reorderLevel: 10 },
  { title: "Wireless Mouse", sku: "MOU-001", price: 700, stock: 120, reorderLevel: 30 },
  { title: "Keyboard", sku: "KEY-001", price: 1500, stock: 8, reorderLevel: 20 },
  { title: "Monitor 24 inch", sku: "MON-001", price: 11000, stock: 15, reorderLevel: 5 },
  { title: "USB Cable", sku: "USB-001", price: 250, stock: 4, reorderLevel: 25 },
  { title: "Office Chair", sku: "CHR-001", price: 6500, stock: 12, reorderLevel: 5 },
];

const customers = [
  { name: "Sharma Traders", contact: "9876543210", email: "sharma@example.com", address: "Ahmedabad, Gujarat" },
  { name: "Patel Enterprises", contact: "9898989898", email: "patel@example.com", address: "Surat, Gujarat" },
];

const suppliers = [
  { name: "Tech Distributors", contact: "9123456780", email: "tech@example.com", address: "Mumbai, Maharashtra" },
  { name: "Office World", contact: "9345678901", email: "office@example.com", address: "Pune, Maharashtra" },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const u of users) if (!(await User.findOne({ email: u.email }))) await User.create(u);
  for (const p of products) if (!(await Product.findOne({ sku: p.sku }))) await Product.create(p);
  for (const c of customers) if (!(await Customer.findOne({ name: c.name }))) await Customer.create(c);
  for (const s of suppliers) if (!(await Supplier.findOne({ name: s.name }))) await Supplier.create(s);
  console.log("Seed done");
  process.exit(0);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});