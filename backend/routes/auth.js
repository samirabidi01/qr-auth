import express from "express";
import { generateQR, approveQR, verifyQR } from "../controllers/authController.js";
import { protect } from "../middleware/authMidlleware.js";

const router = express.Router();

// Generate QR token (desktop)
router.post("/qr/generate", generateQR);

// Mobile approves QR (must be logged in)
router.post("/qr/approve", protect, approveQR);

// Verify QR token (desktop receives JWT)
router.post("/qr/verify", verifyQR);

// router.get("/qr/open", (req, res) => {
//   const token = req.query.token;

//   // Redirect mobile to React page
//   res.redirect(`${process.env.FRONTEND_URL}/qr-approve?token=${token}`);
// });


export default router;
