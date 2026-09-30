const Application = require("../models/Application");
const Job = require("../models/Job");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadResumeFile,
} = require("../utils/cloudinaryUpload");

const STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
];

// ======================================================
// APPLY TO JOB
// ======================================================

const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  if (job.status === "closed") {
    return res.status(400).json({
      success: false,
      message:
        "This job is closed and no longer accepting applications",
    });
  }

  if (
    job.deadline &&
    new Date(job.deadline) < new Date()
  ) {
    return res.status(400).json({
      success: false,
      message:
        "The application deadline for this job has passed",
    });
  }

  const alreadyApplied = await Application.findOne({
    candidate: req.user._id,
    job: job._id,
  });

  if (alreadyApplied) {
    return res.status(409).json({
      success: false,
      message: "You have already applied to this job",
    });
  }

  // Use candidate's saved resume by default
  let resumePath = req.user.resume;

  // If candidate uploads a new resume while applying,
  // upload it to Cloudinary.
  if (req.file) {
    const uploadedResume = await uploadResumeFile(
      req.file
    );

    resumePath = uploadedResume.secure_url;
  }

  if (!resumePath) {
    return res.status(400).json({
      success: false,
      message:
        "Please upload a resume with this application or add one to your profile first",
    });
  }

  const application = await Application.create({
    candidate: req.user._id,
    job: job._id,
    recruiter: job.recruiter,
    resume: resumePath,
    coverLetter: req.body.coverLetter || "",
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

// ======================================================
// GET MY APPLICATIONS
// ======================================================

const getMyApplications = asyncHandler(
  async (req, res) => {
    const applications = await Application.find({
      candidate: req.user._id,
    })
      .populate({
        path: "job",
        select:
          "title company location jobType workMode salary status",
      })
      .populate(
        "recruiter",
        "name companyName email"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Applications fetched",
      data: applications,
    });
  }
);

// ======================================================
// CANDIDATE DASHBOARD STATS
// ======================================================

const getCandidateStats = asyncHandler(
  async (req, res) => {
    const candidateId = req.user._id;

    const [
      submitted,
      underReview,
      interviews,
      selected,
      rejected,
      recentApplications,
    ] = await Promise.all([
      Application.countDocuments({
        candidate: candidateId,
      }),

      Application.countDocuments({
        candidate: candidateId,
        status: "Under Review",
      }),

      Application.countDocuments({
        candidate: candidateId,
        status: "Interview",
      }),

      Application.countDocuments({
        candidate: candidateId,
        status: "Selected",
      }),

      Application.countDocuments({
        candidate: candidateId,
        status: "Rejected",
      }),

      Application.find({
        candidate: candidateId,
      })
        .populate(
          "job",
          "title company location"
        )
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      message: "Candidate statistics fetched",

      data: {
        stats: {
          submitted,
          underReview,
          interviews,
          selected,
          rejected,
        },

        recentApplications,
      },
    });
  }
);

// ======================================================
// GET APPLICATIONS FOR RECRUITER
// ======================================================

const getApplicationsForJob = asyncHandler(
  async (req, res) => {
    const job = await Job.findById(
      req.params.jobId
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (
      job.recruiter.toString() !==
      req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only view applicants for your own jobs",
      });
    }

    const applications = await Application.find({
      job: job._id,
    })
      .populate(
        "candidate",
        "name email phone location skills experience education resume profileImage"
      )
      .sort({ createdAt: -1 });

    // ==================================================
    // FIX OLD RESUME URLS
    // ==================================================
    //
    // Old application:
    // /uploads/resumes/resume-123.pdf
    //
    // New candidate resume:
    // https://res.cloudinary.com/...
    //
    // If application contains an old resume path,
    // use candidate's latest Cloudinary resume instead.
    // ==================================================

    const fixedApplications = applications.map(
      (application) => {
        const app = application.toObject();

        const applicationResume = app.resume;

        const candidateResume =
          app.candidate?.resume;

        const applicationHasCloudinaryResume =
          applicationResume &&
          /^https?:\/\//i.test(
            applicationResume
          );

        const candidateHasCloudinaryResume =
          candidateResume &&
          /^https?:\/\//i.test(candidateResume);

        if (
          !applicationHasCloudinaryResume &&
          candidateHasCloudinaryResume
        ) {
          app.resume = candidateResume;
        }

        return app;
      }
    );

    res.status(200).json({
      success: true,
      message: "Applications fetched",

      data: {
        job,
        applications: fixedApplications,
      },
    });
  }
);

// ======================================================
// UPDATE APPLICATION STATUS
// ======================================================

const updateApplicationStatus = asyncHandler(
  async (req, res) => {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUSES.join(
          ", "
        )}`,
      });
    }

    const application =
      await Application.findById(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (
      application.recruiter.toString() !==
      req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update applications for your own jobs",
      });
    }

    application.status = status;

    await application.save();

    res.status(200).json({
      success: true,
      message: `Application marked as ${status}`,
      data: application,
    });
  }
);

// ======================================================
// WITHDRAW APPLICATION
// ======================================================

const withdrawApplication = asyncHandler(
  async (req, res) => {
    const application =
      await Application.findById(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (
      application.candidate.toString() !==
      req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only withdraw your own applications",
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: "Application withdrawn",
      data: {},
    });
  }
);

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  applyToJob,
  getMyApplications,
  getCandidateStats,
  getApplicationsForJob,
  updateApplicationStatus,
  withdrawApplication,
};