const express = require("express");
const { getDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Har logged-in user dekh sakta hai, frontend role ke hisaab se cards dikhata hai
router.get("/", protect, getDashboard);

module.exports = router;
