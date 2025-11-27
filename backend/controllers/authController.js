import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import { io } from "../server.js";

// Generate QR token
export const generateQR = async (req, res) => {
  try {
    const qrToken = Math.random().toString(36).substring(2, 15);
    const expireAt = Date.now() + 60_000; // 1 min expiry

    await redis.hmset(`qr:${qrToken}`, { confirmed: 0, expireAt });
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
    if (!session || Date.now() > parseInt(session.expireAt)) {
      return res.json({ success: false, message: "Invalid or expired QR token" });
    }

    await redis.hmset(`qr:${qrToken}`, { confirmed: 1, userId: mobileUser.id });

    // Emit event to desktop
    io.to(qrToken).emit("qr-approved", { userId: mobileUser.id });

    res.json({ success: true, message: "QR approved" });
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
    if (!session || session.confirmed != "1") {
      return res.json({ success: false, message: "Not authorized" });
    }

    // Generate JWT for desktop
    const token = jwt.sign({ id: session.userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Delete QR session
    await redis.del(`qr:${qrToken}`);

    res.cookie("token", token, { httpOnly: true });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
