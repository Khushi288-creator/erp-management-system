const express = require("express");
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} = require("../controllers/purchaseOrderController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Dekhna: admin, purchase, inventory
router.get("/", authorize("admin", "purchase", "inventory"), getPurchaseOrders);
router.get("/:id", authorize("admin", "purchase", "inventory"), getPurchaseOrderById);

// Banana aur status badalna: admin, purchase
router.post("/", authorize("admin", "purchase"), createPurchaseOrder);
router.put("/:id/status", authorize("admin", "purchase"), updatePurchaseOrderStatus);

module.exports = router;
