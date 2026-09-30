const path = require("path");
const { PassThrough } = require("stream");

const { cloudinary } = require("../config/cloudinary");

const safeBaseName = (name) =>
  path
    .basename(name, path.extname(name))
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";

const uploadBuffer = (
  file,
  { folder, resourceType = "image" }
) =>
  new Promise((resolve, reject) => {
    if (!file?.buffer) {
      return reject(
        new Error("No upload data received")
      );
    }

    const unique = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const publicId =
      `${safeBaseName(file.originalname)}-${unique}`;

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: publicId,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary upload error:",
              error
            );

            reject(error);
          } else {
            resolve(result);
          }
        }
      );

    const input = new PassThrough();

    input.end(file.buffer);

    input.pipe(stream);
  });

// ===============================
// PROFILE IMAGE
// ===============================

const uploadProfileImage = (file) =>
  uploadBuffer(file, {
    folder: "hiredesk/profile-images",
    resourceType: "image",
  });

// ===============================
// RESUME
// ===============================

const uploadResumeFile = (file) =>
  uploadBuffer(file, {
    folder: "hiredesk/resumes",
    resourceType: "auto",
  });

module.exports = {
  uploadBuffer,
  uploadProfileImage,
  uploadResumeFile,
};