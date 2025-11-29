import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import { io } from "../server.js"; 
import User from "../models/User.js"; 

// Generate QR token
export const generateQR = async (req, res) => {
  try {
    const qrToken = Math.random().toString(36).substring(2, 15);
    const expireAt = Date.now() + 60_000; // 1 min expiry

    // Store QR data in Redis
    await redis.hmset(`qr:${qrToken}`, { confirmed: 0, expireAt, userId: "pending" });
    await redis.expire(`qr:${qrToken}`, 60);

    res.json({ success: true, qrToken, expiresIn: 60 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error in generateQR" });
  }
};

// Approve QR token (mobile) - THIS IS THE CORRECTED FUNCTION
export const approveQR = async (req, res) => {
  console.log("======== 📌 approveQR() CALLED ========");
  try {
    const { qrToken } = req.body;
    // req.user is added by your 'protect' middleware
    const userId = req.user.id; 

    if (!qrToken || !userId) {
      return res.status(400).json({ success: false, message: "qrToken or user ID missing" });
    }

    // Get session from Redis
    const session = await redis.hgetall(`qr:${qrToken}`);

    // Session not found in Redis
    if (!Object.keys(session).length) {
      return res.json({ success: false, message: "Invalid or expired QR token" });
    }

    // Session already confirmed
    if (session.confirmed === "1") {
      return res.json({ success: false, message: "QR already confirmed" });
    }

    // Mark QR as confirmed and store the user ID in Redis
    await redis.hmset(`qr:${qrToken}`, { confirmed: 1, userId: userId });

    // ✅ BUG FIX #2: Notify the desktop client via Socket.IO
    // The desktop is in a room named after the qrToken.
    io.to(qrToken).emit("qr-approved");
    console.log(`✅ QR approved. Emitted 'qr-approved' to room ${qrToken}`);

    // The mobile client doesn't need a new token, just confirmation.
    return res.json({
      success: true,
      message: "QR approved successfully. Desktop will now log in.",
    });

  } catch (err) {
    console.error("🔥 SERVER ERROR in approveQR():", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// Verify QR token (desktop)
export const verifyQR = async (req, res) => {
  const { qrToken } = req.body;
  try {
    const session = await redis.hgetall(`qr:${qrToken}`);

    // Check if session is valid and confirmed
    if (!session || session.confirmed !== "1" || session.userId === "pending") {
      return res.json({ success: false, message: "Not authorized or QR not approved" });
    }

    // Generate JWT for desktop using the userId from Redis
    const token = jwt.sign({ id: session.userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Delete the QR session from Redis after use
    await redis.del(`qr:${qrToken}`);

    // Send JWT to desktop in an HttpOnly cookie
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.json({ success: true, message: "Login successful" });

  } catch (err) {
    console.error("🔥 SERVER ERROR in verifyQR():", err);
    res.status(500).json({ success: false, message: "Server error in verifyQR" });
  }
};
 // register
 export const register =async(req,res)=>{
    try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
 export const login =async(req,res)=>{
   try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Optionally send token as HttpOnly cookie
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });

    res.json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
 
