const express = require("express");
const { getUsers, updateUserRole } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Is file ke saare routes sirf admin ke liye
router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.put("/:id/role", updateUserRole);

module.exports = router;