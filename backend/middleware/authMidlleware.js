import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  // Authorization: Bearer xxx
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await userModel.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
