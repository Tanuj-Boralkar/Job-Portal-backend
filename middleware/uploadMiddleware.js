const path = require("path");
const multer = require("multer");

// Store uploaded files temporarily in memory.
// Controllers will upload the buffers to Cloudinary.
const storage = multer.memoryStorage();

const RESUME_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
];

const IMAGE_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  // Resume validation
  if (file.fieldname === "resume") {
    if (!RESUME_TYPES.includes(extension)) {
      const error = new Error(
        "Resume must be a PDF, DOC, or DOCX file"
      );

      error.statusCode = 400;

      return cb(error);
    }

    return cb(null, true);
  }

  // Profile image validation
  if (file.fieldname === "profileImage") {
    if (!IMAGE_TYPES.includes(extension)) {
      const error = new Error(
        "Profile image must be a JPG, JPEG, PNG, or WEBP file"
      );

      error.statusCode = 400;

      return cb(error);
    }

    return cb(null, true);
  }

  return cb(
    new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      file.fieldname
    )
  );
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadProfileFiles = upload.fields([
  {
    name: "profileImage",
    maxCount: 1,
  },
  {
    name: "resume",
    maxCount: 1,
  },
]);

const uploadResume =
  upload.single("resume");

module.exports = {
  upload,
  uploadProfileFiles,
  uploadResume,
};