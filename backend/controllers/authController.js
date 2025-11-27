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
  console.log("======== 📌 approveQR() CALLED ========");

  try {
    const { qrToken } = req.body;

    console.log("👉 Received qrToken:", qrToken);

    if (!qrToken) {
      console.error("❌ No qrToken received");
      return res.status(400).json({ success: false, message: "qrToken missing" });
    }

    const session = qrSessions.get(qrToken);

    console.log("👉 Session from qrSessions:", session);

    // Session not found
    if (!session) {
      console.error("❌ Session not found for qrToken");
      return res.json({ success: false, message: "invalid or expired qr token" });
    }

    // Session expired
    if (session.expireAt < Date.now()) {
      console.error("❌ Session expired at:", session.expireAt, " Current:", Date.now());
      qrSessions.delete(qrToken);
      return res.json({ success: false, message: "qr expired" });
    }

    // Session already confirmed
    if (session.confirmed) {
      console.warn("⚠️ Session already confirmed!");
      return res.json({ success: false, message: "qr already confirmed" });
    }

    // Mark QR as confirmed
    session.confirmed = true;
    qrSessions.set(qrToken, session);

    console.log("✅ QR session updated:", session);

    // Generate JWT token
    const token = jwt.sign(
      { id: session.userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🔑 JWT token generated for user:", session.userId);

    return res.json({
      success: true,
      message: "QR approved successfully",
      token,
    });

  } catch (err) {
    console.error("🔥 SERVER ERROR in approveQR():", err);
    return res.status(500).json({
      success: false,
      message: "server error",
      error: err.message,
    });
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
