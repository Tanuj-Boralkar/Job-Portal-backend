const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getJobs,
  getApplications,
  deleteUser,
  updateUserStatus,
  deleteJob,
  updateJobStatus,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Every admin route is protected and admin-only
router.use(protect, authorizeRoles("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.get("/jobs", getJobs);
router.get("/applications", getApplications);

router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", updateUserStatus);

router.delete("/jobs/:id", deleteJob);
router.patch("/jobs/:id/status", updateJobStatus);

module.exports = router;