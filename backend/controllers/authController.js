import userModel from "../models/userModel.js";
import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import { io } from "../server.js";

// ----------------------------
// Generate JWT
// ----------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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
      token,     // ADD THIS
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
    const qrToken = crypto.randomUUID();
    const expireAt = Date.now() + 60000; // 1 minute

    await redis.hmset(`qr:${qrToken}`, {
      confirmed: "0",
      expireAt: expireAt.toString()
    });

    await redis.expire(`qr:${qrToken}`, 60);

    res.json({ success: true, qrToken, expiresIn: 60 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// Approve QR token (mobile)
export const approveQR = async (req, res) => {
  const { qrToken } = req.body;
  const mobileUser = req.user;

  try {
    const session = await redis.hgetall(`qr:${qrToken}`);

    if (!session || !session.expireAt) {
      return res.json({ success: false, message: "Invalid QR token" });
    }

    if (Date.now() > Number(session.expireAt)) {
      await redis.del(`qr:${qrToken}`);
      return res.json({ success: false, message: "Expired QR token" });
    }

    // Mark QR confirmed
    await redis.hmset(`qr:${qrToken}`, {
      confirmed: "1",
      userId: mobileUser.id
    });

    // Notify desktop
    io.to(qrToken).emit("qr-approved");

    res.json({ success: true, message: "QR approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// Verify QR token (desktop)
export const verifyQR = async (req, res) => {
  const { qrToken } = req.body;

  try {
    const session = await redis.hgetall(`qr:${qrToken}`);

    if (!session || session.confirmed !== "1") {
      return res.json({ success: false, message: "Not authorized" });
    }

    if (Date.now() > Number(session.expireAt)) {
      await redis.del(`qr:${qrToken}`);
      return res.json({ success: false, message: "QR expired" });
    }

    const token = jwt.sign(
      { id: session.userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await redis.del(`qr:${qrToken}`);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};