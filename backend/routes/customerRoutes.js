const express = require("express");
const Customer = require("../models/Customer");
const crud = require("../utils/crudFactory");
const { protect, authorize } = require("../middleware/authMiddleware");

const c = crud(Customer, ["name", "email", "contact"], "Customer");
const router = express.Router();

router.use(protect, authorize("admin", "sales"));

router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", authorize("admin"), c.remove);

module.exports = router;
