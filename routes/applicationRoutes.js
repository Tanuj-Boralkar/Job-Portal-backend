const express = require("express");
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getCandidateStats,
  getApplicationsForJob,
  updateApplicationStatus,
  withdrawApplication,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadResume } = require("../middleware/uploadMiddleware");

router.get("/my-applications", protect, authorizeRoles("candidate"), getMyApplications);
router.get("/candidate/stats", protect, authorizeRoles("candidate"), getCandidateStats);
router.get("/job/:jobId", protect, authorizeRoles("recruiter", "admin"), getApplicationsForJob);

router.post("/:jobId", protect, authorizeRoles("candidate"), uploadResume, applyToJob);
router.patch("/:id/status", protect, authorizeRoles("recruiter", "admin"), updateApplicationStatus);
router.delete("/:id", protect, authorizeRoles("candidate", "admin"), withdrawApplication);

module.exports = router;