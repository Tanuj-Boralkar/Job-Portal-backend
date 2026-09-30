// const path = require("path");
// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config({ path: path.join(__dirname, ".env") });

// const connectDB = require("./config/db");
// const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const jobRoutes = require("./routes/jobRoutes");
// const applicationRoutes = require("./routes/applicationRoutes");
// const adminRoutes = require("./routes/adminRoutes");


// const app = express();

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     "  https://job-portal-frontend-one-iota.vercel.app/",

//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Serve uploaded resumes and profile images
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/api/v1/health", (req, res) => {
//   res.status(200).json({ success: true, message: "Job Portal API is running", data: { time: new Date() } });
// });

// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/jobs", jobRoutes);
// app.use("/api/v1/applications", applicationRoutes);
// app.use("/api/v1/admin", adminRoutes);

// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// const start = async () => {
//   if (!process.env.MONGO_URI) throw new Error("Set MONGO_URI in backend/.env");
//   if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === "This_is_secret_of_my_job Portal1234.") throw new Error("Set a random JWT_SECRET of at least 32 characters. Run npm run setup for a fresh installation.");
//   await connectDB();
//   return app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// };

// if (require.main === module) {
//   start().catch((error) => {
//     console.error(`Startup failed: ${error.message}`);
//     process.exitCode = 1;
//   });
// }

// module.exports = { app, start };


const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({
  path: path.join(__dirname, ".env"),
});

const connectDB = require("./config/db");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ======================================================
// CORS CONFIGURATION
// ======================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://job-portal-frontend-one-iota.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // Example: Postman, Thunder Client, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow approved origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);

      return callback(
        new Error(`CORS policy does not allow origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// STATIC FILES
// ======================================================

// Serve uploaded resumes and profile images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running",
    data: {
      time: new Date(),
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/jobs", jobRoutes);

app.use("/api/v1/applications", applicationRoutes);

app.use("/api/v1/admin", adminRoutes);

// ======================================================
// ERROR HANDLING
// ======================================================

app.use(notFound);

app.use(errorHandler);

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Check MongoDB URI
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing. Add MONGO_URI to environment variables."
      );
    }

    // Check JWT Secret
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET ===
      "This_is_secret_of_my_job Portal1234."
    ) {
      throw new Error(
        "Set a secure random JWT_SECRET of at least 32 characters."
      );
    }

    // Connect MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Environment: ${process.env.NODE_ENV || "development"}`
      );
      console.log("Allowed CORS origins:", allowedOrigins);
    });

    return server;
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  start().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = {
  app,
  start,
};