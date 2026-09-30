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
      return reject(new Error("No upload data received"));
    }

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const unique = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const publicId =
      resourceType === "raw"
        ? `${safeBaseName(
          file.originalname
        )}-${unique}${extension}`
        : `${safeBaseName(
          file.originalname
        )}-${unique}`;

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

const uploadProfileImage = (file) =>
  uploadBuffer(file, {
    folder: "hiredesk/profile-images",
    resourceType: "image",
  });

const uploadResumeFile = (file) =>
  uploadBuffer(file, {
    folder: "hiredesk/resumes",
    resourceType: "raw",
  });

module.exports = {
  uploadBuffer,
  uploadProfileImage,
  uploadResumeFile,
};