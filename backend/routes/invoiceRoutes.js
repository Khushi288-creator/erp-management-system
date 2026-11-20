const express = require("express");
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  markInvoicePaid,
} = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin", "sales"));

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id/pay", markInvoicePaid);

module.exports = router;
