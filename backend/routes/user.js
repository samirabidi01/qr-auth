import express from "express";
import { protect } from "../middleware/authMidlleware.js";
import { getProfile } from "../controllers/userController.js";

const router = express.Router();

// GET /api/user/me
router.get("/me", protect, getProfile);

export default router;
