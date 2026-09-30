const path = require("path");
const fs = require("fs");
const multer = require("multer");

const resumeDir = path.join(__dirname, "..", "uploads", "resumes");
const profileDir = path.join(__dirname, "..", "uploads", "profiles");

// Fixed: semicolon above prevents the array from joining the previous line.
[resumeDir, profileDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const directory =
      file.fieldname === "resume" ? resumeDir : profileDir;

    cb(null, directory);
  },

  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = file.fieldname === "resume" ? "resume" : "profile";
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${prefix}-${unique}${extension}`);
  },
});

const RESUME_TYPES = [".pdf", ".doc", ".docx"];
const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "resume") {
    if (!RESUME_TYPES.includes(extension)) {
      const error = new Error("Resume must be a PDF, DOC, or DOCX file");
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  }

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
    new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname)
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB per file.
  },
});

const uploadProfileFiles = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

const uploadResume = upload.single("resume");

module.exports = {
  upload,
  uploadProfileFiles,
  uploadResume,
};