const multer = require("multer");

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// Define errorHandler outside notFound so it can be exported.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode =
    err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);

  let message = err.message || "Something went wrong";

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.code === 11000) {
    statusCode = 409;

    const fields = Object.keys(err.keyValue || err.keyPattern || {});

    message =
      fields.includes("candidate") && fields.includes("job")
        ? "You have already applied to this job"
        : `Duplicate value entered for: ${fields.join(", ") || "unique field"}`;
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum allowed size is 5 MB"
        : err.message;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };