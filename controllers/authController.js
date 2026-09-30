const User = require("../models/User.js")
const generateToken = require("../utils/generateToken.js")

const asyncHandler = require("../utils/asyncHandler.js")

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  resume: user.resume,
  companyName: user.companyName,
})

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, companyName } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name , email and password are required" })
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: "password must be at least 6 characters" })
  }

  const allowedRoles = ["candidate", "recruiter"]
  const finalRole = allowedRoles.includes(role) ? role : "candidate"

  const exists = await User.findOne({ email: String(email).trim().toLowerCase() })
  if (exists) {
    return res.status(409).json({ success: false, message: " An account with this email already exists" })
  }
  const user = await User.create({
    name, email, phone: phone || "",
    password,
    role: finalRole,
    companyName: finalRole === "recruiter" ? companyName || "" : "",
  })
  res.status(201).json({
    success: true,
    message: "Registration successful",
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" })
  }
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password")
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email and  password" })
  }
  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: "Your account has been blocked by the administrator" })
  }
  res.status(200).json({
    success: true,
    message: "login succussful",
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  })
})

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "User fetched", data: req.user })
})
const setupAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, setupKey } = req.body
  if (!process.env.ADMIN_SETUP_KEY) {
    return res.status(500).json({ success: false, message: "ADMIN_SETUP_KEY is not configured on the server" })
  }
  if (setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(401).json({ success: false, message: "Invalid setup key" })
  }

  const adminExists = await User.findOne({ role: "admin" })
  if (adminExists) {
    return res.status(409).json({ success: false, message: "An admin account already exists" })
  }
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" })
  }
  const admin = await User.create({ name, email, password, role: "admin" })

  res.status(201).json({
    success: true,
    message: "Admin account created successfully",
    token: generateToken(admin._id, admin.role),
    user: publicUser(admin),
  })
})

module.exports = { register, login, getMe, setupAdmin }