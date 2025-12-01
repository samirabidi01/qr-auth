import userModel from "../models/userModel.js";
import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import { io } from "../server.js";

// ----------------------------
// Generate JWT
// ----------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ----------------------------
// REGISTER
// ----------------------------
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const exists = await userModel.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const user = await userModel.create({ name, email, password });
    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ success: true, message: "Registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------
// LOGIN
// ----------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user._id);

   res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------
// LOGOUT
// ----------------------------
export const logout = (req, res) => {
 res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// ----------------------------
// GENERATE QR TOKEN
// ----------------------------
export const generateQR = async (req, res) => {
  try {
    const qrToken = Math.random().toString(36).substring(2);
    const expireAt = Date.now() + 60000;

    await redis.hSet(`qr:${qrToken}`, {
      confirmed: "0",
      expireAt,
      userId: "pending",
    });

    await redis.expire(`qr:${qrToken}`, 60);

    res.json({ success: true, qrToken, expiresIn: 60 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error generating QR" });
  }
};

// ----------------------------
// APPROVE QR (MOBILE)
// ----------------------------
export const approveQR = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const userId = req.user.id; // From middleware

    if (!qrToken)
      return res.status(400).json({ success: false, message: "QR token missing" });

    const session = await redis.hGetAll(`qr:${qrToken}`);

    if (!session || Object.keys(session).length === 0)
      return res.json({ success: false, message: "Invalid or expired QR token" });

    if (parseInt(session.confirmed) === 1)
      return res.json({ success: false, message: "QR already approved" });

    await redis.hSet(`qr:${qrToken}`, {
      confirmed: "1",
      userId,
    });

    io.to(qrToken).emit("qr-approved");
    console.log(`📢 Emitted "qr-approved" to room: ${qrToken}`);

    res.json({ success: true, message: "QR approved. Desktop will log in." });

  } catch (err) {
    console.error("approveQR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error approving QR" });
  }
};

// ----------------------------
// DESKTOP VERIFY QR
// ----------------------------
export const verifyQR = async (req, res) => {
  try {
    const { qrToken } = req.body;

    const session = await redis.hGetAll(`qr:${qrToken}`);

    if (!session || Object.keys(session).length === 0)
      return res.json({ success: false, message: "Invalid or expired QR token" });

    if (session.confirmed !== "1")
      return res.json({ success: false, message: "QR not yet approved" });

    if (session.userId === "pending")
      return res.json({ success: false, message: "User not assigned" });

    const token = generateToken(session.userId);

    await redis.del(`qr:${qrToken}`);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ success: true, message: "QR login successful" });

  } catch (err) {
    console.error("verifyQR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error verifying QR" });
  }
};
