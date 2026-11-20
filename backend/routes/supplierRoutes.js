const express = require("express");
const Supplier = require("../models/Supplier");
const crud = require("../utils/crudFactory");
const { protect, authorize } = require("../middleware/authMiddleware");

const c = crud(Supplier, ["name", "email", "contact"], "Supplier");
const router = express.Router();

router.use(protect, authorize("admin", "purchase"));

router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", authorize("admin"), c.remove);

module.exports = router;
