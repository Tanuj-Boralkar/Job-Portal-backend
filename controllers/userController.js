
const User = require("../models/User")
const asyncHandler = require("../utils/asyncHandler")
const {
  uploadProfileImage,
  uploadResumeFile,
} = require("../utils/cloudinaryUpload");

const parseSkills = (skills) => {
  if (skills === undefined) return undefined
  if (!skills) return []
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean)
  return String(skills)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }
  res.status(200).json({ success: true, message: "Profile fetched", data: user })
})

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  const fields = ["name", "phone", "experience", "education", "location", "companyName", "companyDescription"]

  fields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field]
  })
  const skills = parseSkills(req.body.skills)
  if (skills) user.skills = skills
  if (req.body.password) {
    if (String(req.body.password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" })
    }
    user.password = req.body.password

  }
  if (req.files?.profileImage?.[0]) {
    const uploadedImage =
      await uploadProfileImage(
        req.files.profileImage[0]
      );

    user.profileImage =
      uploadedImage.secure_url;
  }
  if (req.files?.resume?.[0]) {
    const uploadedResume =
      await uploadResumeFile(
        req.files.resume[0]
      );

    user.resume =
      uploadedResume.secure_url;
  }

  const updated = await user.save()

  res.status(200).json({ success: true, message: "Profile update successfully", data: updated })
})

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }
  res.status(200).json({ success: true, message: "User fetched", data: user })
})
module.exports = { getProfile, updateProfile, getUserById }