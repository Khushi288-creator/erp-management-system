const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // sab ke liye login zaroori

// Dekhna: koi bhi logged-in user
router.get("/", getProducts);
router.get("/:id", getProductById);

// Badalna: sirf admin aur inventory
router.post("/", authorize("admin", "inventory"), createProduct);
router.put("/:id", authorize("admin", "inventory"), updateProduct);
router.delete("/:id", authorize("admin"), deleteProduct);

module.exports = router;