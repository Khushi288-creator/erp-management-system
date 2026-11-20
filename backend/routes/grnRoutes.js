const express = require("express");
const { getGrns, getGrnById, createGrn } = require("../controllers/grnController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin", "inventory", "purchase"), getGrns);
router.get("/:id", authorize("admin", "inventory", "purchase"), getGrnById);
router.post("/", authorize("admin", "inventory"), createGrn);

module.exports = router;
