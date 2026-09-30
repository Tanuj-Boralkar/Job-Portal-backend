const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.join(__dirname, "..");
const destination = path.join(root, ".env");
if (fs.existsSync(destination)) {
  console.log("Existing backend/.env kept unchanged.");
} else {
  const template = fs.readFileSync(path.join(root, ".env.example"), "utf8")
    .replace("replace_with_a_random_secret", crypto.randomBytes(48).toString("hex"))
    .replace("replace_with_a_private_setup_key", crypto.randomBytes(32).toString("hex"));
  fs.writeFileSync(destination, template, { mode: 0o600, flag: "wx" });
  console.log("Created backend/.env. Set MONGO_URI to your MongoDB Atlas connection string, then run npm run dev.");
}
