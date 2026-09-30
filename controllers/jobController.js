const escapeRegex = require("../utils/escapeRegex");
const Application = require("../models/Application")
const asyncHandler = require("../utils/asyncHandler")
const Job = require("../models/Job")

const parseSkills = (skills) => {
  if (!skills) return []
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean)
  return String(skills)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

const createJob = asyncHandler(async (req, res) => {
  const { title, description, company, location } = req.body

  if (!title || !description || !company || !location) {
    return res.status(400).json({
      success: false,
      message: "Title, description, company and location are required"
    })

  }
  const job = await Job.create({
    title, description, company, location,
    jobType: req.body.jobType,
    workMode: req.body.workMode,
    salary: req.body.salary,
    experienceLevel: req.body.experienceLevel,
    skills: parseSkills(req.body.skills),
    category: req.body.category,
    vacancies: req.body.vacancies ?? 1,
    deadline: req.body.deadline || undefined,
    status: req.body.status || "active",
    recruiter: req.user._id,
  })
  res.status(201).json({ success: true, message: "job create successfully", data: job })
})

const getJobs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

  const skip = (page - 1) * limit

  const { keyword, location, jobType, workMode, experienceLevel, category, status } = req.query

  const filter = {}
  filter.status = status || "active"

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i")
    filter.$or = [{ title: regex }, { company: regex }, { description: regex }, { skills: regex }]

  }
  if (location) filter.location = new RegExp(escapeRegex(location), "i")
  if (jobType) filter.jobType = jobType
  if (workMode) filter.workMode = workMode
  if (experienceLevel) filter.experienceLevel = experienceLevel
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i")

  const [jobs, total] = await Promise.all
    ([
      Job.find(filter).populate("recruiter", "name companyName email").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter)
    ])
  res.status(200).json({
    success: true,
    message: "Jobs fetched",
    data: {
      jobs,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    }
  })
})

const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean()

  const jobIds = jobs.map((job) => job._id)
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ])

  const countMap = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count
    return acc
  }, {})
  const withCounts = jobs.map((job) => ({ ...job, applicationsCount: countMap[job._id.toString()] || 0 }))
  res.status(200).json({ success: true, message: "Recruiter jobs fetched", data: withCounts })
})

const getRecruiterStats = asyncHandler(async (req, res) => {
  const recruiterId = req.user._id

  const [totalJobs, activeJobs, totalApplications, shortlisted, selected, recentApplications, recentJobs] = await Promise.all([
    Job.countDocuments({ recruiter: recruiterId }),
    Job.countDocuments({ recruiter: recruiterId, status: "active" }),
    Application.countDocuments({ recruiter: recruiterId }),
    Application.countDocuments({ recruiter: recruiterId, status: "Shortlisted" }),
    Application.countDocuments({ recruiter: recruiterId, status: "Selected" }),
    Application.find({ recruiter: recruiterId })
      .populate("candidate", "name email profileImage")
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .limit(5),
    Job.find({ recruiter: recruiterId }).sort({ createdAt: -1 }).limit(5),
  ])

  res.status(200).json({
    success: true,
    message: "Recruiter statistics fetched",
    data: {
      stats: { totalJobs, activeJobs, totalApplications, shortlisted, selected },
      recentApplications,
      recentJobs,
    }
  })
})

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("recruiter", "name companyName companyDescription email")
  if (!job) {
    return res.status(404).json({ success: false, message: "job nort found" })
  }
  res.status(200).json({ success: true, message: "job fetched", data: job })
})


const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)

  if (!job) {
    return res.status(404).json({ success: false, message: "job not found" })
  }
  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "You can only update jobs that you created" })
  }

  const fields = [
    "title",
    "description",
    "company",
    "location",
    "jobType",
    "workMode",
    "salary",
    "experienceLevel",
    "category",
    "vacancies",
    "deadline",
    "status",
  ]

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = field === "deadline" && req.body[field] === "" ? undefined : req.body[field];
    }
  })

  if (req.body.skills !== undefined) job.skills = parseSkills(req.body.skills)

  const updated = await job.save()
  res.status(200).json({ success: true, message: "JOb updated successfully", data: updated })

})
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
  if (!job) {
    return res.status(404).json({ success: false, message: "job not found" })
  }

  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "you can only delete job that you created" })
  }
  await Application.deleteMany({ job: job._id })
  await job.deleteOne()

  res.status(200).json({ success: true, message: "Job deleted successfully", data: {} })
})


const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  if (!["active", "closed"].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be either active or closed" })
  }
  const job = await Job.findById(req.params.id)
  if (!job) {
    return res.status(404).json({ success: false, message: "job not found" })
  }
  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "You can only change the status own jobs" })
  }
  job.status = status
  await job.save()

  res.status(200).json({ success: true, message: `Job marked as ${status}`, data: job })
})

module.exports = {
  createJob, getJobs, getMyJobs,
  getRecruiterStats, getJobById, updateJob, deleteJob, updateJobStatus
}

