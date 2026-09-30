const express = require("express")
const { protect } = require("../middleware/authMiddleware")
const { authorizeRoles } = require("../middleware/roleMiddleware")
const router = express.Router()
const {
  createJob,
  getJobs, getMyJobs, getRecruiterStats, getJobById,
  updateJob,
  deleteJob,
  updateJobStatus,
} = require("../controllers/jobController")

router.get(["/recruiter/my-jobs", "/recruiter/my-job"], protect, authorizeRoles("recruiter"), getMyJobs)
router.get("/recruiter/stats", protect, authorizeRoles("recruiter"), getRecruiterStats);

router.route("/").get(getJobs).post(protect, authorizeRoles("recruiter", "admin"), createJob);

router
  .route("/:id")
  .get(getJobById)
  .put(protect, authorizeRoles("recruiter", "admin"), updateJob)
  .delete(protect, authorizeRoles("recruiter", "admin"), deleteJob);

router.patch("/:id/status", protect, authorizeRoles("recruiter", "admin"), updateJobStatus);

module.exports = router;