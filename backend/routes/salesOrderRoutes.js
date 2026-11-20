const express = require("express");
const {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrderStatus,
} = require("../controllers/salesOrderController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Dekhna: admin, sales, inventory
router.get("/", authorize("admin", "sales", "inventory"), getSalesOrders);
router.get("/:id", authorize("admin", "sales", "inventory"), getSalesOrderById);

// Banana aur status badalna: admin, sales
router.post("/", authorize("admin", "sales"), createSalesOrder);
router.put("/:id/status", authorize("admin", "sales"), updateSalesOrderStatus);

module.exports = router;
