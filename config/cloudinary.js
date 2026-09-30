const cloudinary = require("cloudinary").v2;

const configureCloudinary = () => {
  console.log("Configuring Cloudinary...");

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME is missing"
    );
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error(
      "CLOUDINARY_API_KEY is missing"
    );
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "CLOUDINARY_API_SECRET is missing"
    );
  }

  cloudinary.config({
    cloud_name:
      process.env.CLOUDINARY_CLOUD_NAME.trim(),

    api_key:
      process.env.CLOUDINARY_API_KEY.trim(),

    api_secret:
      process.env.CLOUDINARY_API_SECRET.trim(),

    secure: true,
  });

  console.log("Cloudinary configured successfully");
};

module.exports = {
  cloudinary,
  configureCloudinary,
};