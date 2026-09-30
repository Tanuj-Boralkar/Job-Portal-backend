const escapeRegex = require("../utils/escapeRegex");
const User = require("../models/User")

const Job = require("../models/Job")
const Application = require("../models/Application")

const asyncHandler = require("../utils/asyncHandler")

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCandidates,
    totalRecruiters,
    totalJobs,
    activeJobs,
    totalApplications,
    selectedCandidates,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "candidate" }),
    User.countDocuments({ role: "recruiter" }),
    Job.countDocuments(),
    Job.countDocuments({ status: "active" }),
    Application.countDocuments(),
    Application.countDocuments({ status: "Selected" }),
    User.find().sort({ createdAt: -1 }).limit(5),
    Job.find().populate("recruiter", "name companyName").sort({ createdAt: -1 }).limit(5)
  ])

  res.status(200).json({
    success: true,
    message: "Dashboard statistics fetched",
    data: {
      stats: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalJobs,
        activeJobs,
        totalApplications,
        selectedCandidates,
      },
      recentUsers,
      recentJobs,
    },
  })
})

const getUsers = asyncHandler(async (req, res) => {
  const { role, keyword } = req.query

  const filter = {}
  if (role) filter.role = role
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i")
    filter.$or = [{ name: regex }, { email: regex }, { companyName: regex }]
  }

  const users = await User.find(filter).sort({ createdAt: -1 })
  res.status(200).json({ success: true, message: "Users fetched", data: users })
})

const getJobs = asyncHandler(async (req, res) => {
  const { status, keyword } = req.query
  const filter = {}
  if (status) filter.status = status
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), 'i')
    filter.$or = [{ title: regex }, { company: regex }, { location: regex }]

  }

  const jobs = await Job.find(filter).populate("recruiter", "name email companyName").sort({ createdAt: -1 })
  res.status(200).json({ success: true, message: "Jobs fetched", data: jobs })
})

const getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query
  const filter = {}
  if (status) filter.status = status

  const applications = await Application.find(filter)
    .populate("candidate", "name email")
    .populate("job", "title company")
    .populate("recruiter", "name companyName")
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, message: "Applications fetched", data: applications })

})

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot delete your own admin account" })
  }

  if (user.role === "recruiter") {
    const jobs = await Job.find({ recruiter: user._id }).select("_id")
    const jobIds = jobs.map((job) => job._id)
    await Application.deleteMany({ job: { $in: jobIds } })
    await Job.deleteMany({ recruiter: user._id })
  }

  if (user.role === "candidate") {
    await Application.deleteMany({ candidate: user._id })
  }

  await user.deleteOne()

  res.status(200).json({ success: true, message: "User deleted successfully", data: {} })
})

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isBlocked } = req.body

  if (typeof isBlocked !== "boolean") {
    return res.status(400).json({ success: false, message: "isBlocked must be true or false" })
  }

  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot block your own admin account" })
  }

  user.isBlocked = isBlocked

  await user.save()

  res.status(200).json({
    success: true,
    message: isBlocked ? "User blocked" : "User unblocked",
    data: user,
  })
})


const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not Found" })
  }

  await Application.deleteMany({ job: job._id })
  await job.deleteOne()

  res.status(200).json({ success: true, message: "Job deleted successfully", data: {} })
})

const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!["active", "closed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be either active or closed" })
  }
  const job = await Job.findById(req.params.id)
  if (!job) {
    return res.status(404).json({ success: false, message: "job not found" })
  }

  job.status = status
  await job.save()

  res.status(200).json({ success: true, message: `Job marked as ${status}`, data: job })
})


module.exports = {
  getDashboardStats,
  getUsers,
  getJobs, getApplications,
  deleteUser,
  updateUserStatus,
  deleteJob,
  updateJobStatus
}