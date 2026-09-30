const mongoose = require("mongoose")

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,

    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      type: String,
      default: "",
    },
    coverLetter: {
      type: String,
      default: "",
      maxlength: [3000, "Cover letter cannot exceed 3000 characters"],
    },
    status: {
      type: String,
      enum: ["Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"],
      default: "Applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true })

module.exports = mongoose.model("Application", applicationSchema)