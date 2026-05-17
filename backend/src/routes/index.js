const router = require("express").Router();

const usersRoutes = require("../modules/users/users.routes");
const vehiclesRoutes = require("../modules/vehicles/vehicles.routes");
const tariffsRoutes = require("../modules/tariffs/tariffs.routes");
const areasRoutes = require("../modules/areas/areas.routes");
const reportsRoutes = require("../modules/reports/reports.routes");
const logsRoutes = require("../modules/logs/logs.routes");

const slotsRoutes = require("../modules/parking/slots.routes");
const reservationsRoutes = require("../modules/parking/reservations.routes");
const paymentRoutes = require("../modules/parking/payment.routes");
const waitlistRoutes = require("../modules/parking/waitlist.routes");
const recurringRoutes = require("../modules/parking/recurring.routes");

router.use("/users", usersRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/tariffs", tariffsRoutes);
router.use("/lots", areasRoutes);
router.use("/analytics", reportsRoutes);
router.use("/audit-logs", logsRoutes);

router.use("/slots", slotsRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/payments", paymentRoutes);
router.use("/waitlist", waitlistRoutes);
router.use("/recurring", recurringRoutes);

module.exports = router;

