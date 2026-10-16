const jwt = require("jsonwebtoken");
const User = require("../models/user");


module.exports = async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id");
      if (user) req.user = user;
    }
  } catch (error) {
   
  }
  next();
};