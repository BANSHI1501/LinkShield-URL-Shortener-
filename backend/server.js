import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import urlRoutes from "./routes/urlRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// 🔥 SIMPLE CORS (NO ERROR)
app.use(cors({
  origin: "*",   // sab allow (fast fix)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.json({
    message: "URL Shortener API is running 🚀"
  });
});

// ✅ Routes
app.use("/", urlRoutes);
app.use("/api/auth", authRoutes);

// 🚀 Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});