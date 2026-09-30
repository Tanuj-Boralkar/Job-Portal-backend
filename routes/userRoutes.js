const express = require("express");

const {
  getProfile,
  updateProfile,
  getUserById,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadProfileFiles } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Get the logged-in user's profile.
router.get("/profile", protect, getProfile);

// Update profile with optional profileImage and resume files.
router.put("/profile", protect, uploadProfileFiles, updateProfile);

// Keep dynamic /:id routes after /profile.
router.get(
  "/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  getUserById
);

module.exports = router;