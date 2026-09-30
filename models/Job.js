const mongoose = require("mongoose")

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [120, "title cannot exceed 120 characters"],

    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,

    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,

    },
    jobType: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Contract", "Freelance"],
      default: "Full Time",
    },
    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },
    salary: {
      type: String,
      default: "Not disclosed",
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5+ Years"],
      default: "Fresher",
    },
    skills: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "Other",
      trim: true,
    },
    vacancies: {
      type: Number,
      default: 1,
      min: [1, "There must be at least on vacancy"],

    },
    deadline: {
      type: Date,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
)

jobSchema.index({ title: "text", description: "text", company: "text", skills: "text" })

module.exports = mongoose.model("Job", jobSchema)