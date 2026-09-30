const jwt = require("jsonwebtoken")
const User = require("../models/User")

const asyncHandler = require("../utils/asyncHandler")

const protect = asyncHandler(async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" })
  }
  let decoded

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token is invalid or expired" })
  }

  const user = await User.findById(decoded.id)

  if (!user) {
    return res.status(401).json({ success: false, message: "Not authorized, user no longer exister" })
  }
  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: "Your account has been blocked by the administrator" })
  }
  req.user = user
  next()
})

module.exports = { protect }