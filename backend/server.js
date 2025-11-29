import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import { initSocket } from "./config/socket.js";
import { connectDB } from "./config/db.js";
import path from "path"; // 👈 Add this import
import { fileURLToPath } from "url"; // 👈 Add this import

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
connectDB();

// Socket.io
export const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*", credentials: true },
});
initSocket(io);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});



// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
