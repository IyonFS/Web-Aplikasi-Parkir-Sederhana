const router = require("express").Router();
const {
  listReservations,
  createReservation,
  cancelReservation,
  getReservation,
  extendReservation,
  getQRToken,
  deleteFinishedReservation,
  deleteCompletedReservations,
} = require("./reservations.controller");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

router.get("/", authenticate, listReservations);
router.post("/", authenticate, createReservation);
router.get("/:id", authenticate, getReservation);
router.patch("/:id/cancel", authenticate, cancelReservation);
router.patch("/:id/extend", authenticate, extendReservation);
router.get("/:id/qr-token", authenticate, getQRToken);
router.delete(
  "/completed",
  authenticate,
  authorize("operator", "admin"),
  deleteCompletedReservations,
);
router.delete("/:id", authenticate, deleteFinishedReservation);

module.exports = router;


