const router = require("express").Router();
const {
  listSlots,
  getSlot,
  createSlot,
  updateSlot,
  deleteSlot,
  updateSlotStatus,
} = require("./slots.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

router.get("/", authenticate, listSlots);
router.get("/:id", authenticate, getSlot);
router.post("/", authenticate, authorize("admin"), createSlot);
router.patch("/:id", authenticate, authorize("admin"), updateSlot);
router.delete("/:id", authenticate, authorize("admin"), deleteSlot);
router.patch(
  "/:id/status",
  authenticate,
  authorize("operator", "admin"),
  updateSlotStatus,
);

module.exports = router;


