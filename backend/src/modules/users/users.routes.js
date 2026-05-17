const router = require("express").Router();
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleActive,
  updateRole,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword,
} = require("./users.controller");

// ── Profile (semua user login) ─────────────────────────────────────────────
router.get("/me/profile", authenticate, getProfile);
router.patch("/me/profile", authenticate, updateProfile);
router.patch("/me/password", authenticate, changePassword);

// ── User Management (admin only) ──────────────────────────────────────────
router.get("/", authenticate, authorize("admin"), listUsers);
router.post("/", authenticate, authorize("admin"), createUser);
router.get("/:id", authenticate, authorize("admin"), getUser);
router.patch("/:id", authenticate, authorize("admin"), updateUser);
router.patch(
  "/:id/toggle-active",
  authenticate,
  authorize("admin"),
  toggleActive,
);
router.patch("/:id/role", authenticate, authorize("admin"), updateRole);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

module.exports = router;


