const authorizeRoles = (...roles) => {

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to : ${roles.join(", ")}`,
      })
    }

    next()
  }
}

module.exports = { authorizeRoles }