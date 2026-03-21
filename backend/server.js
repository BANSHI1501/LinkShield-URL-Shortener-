import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import urlRoutes from "./routes/urlRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.set("trust proxy", true);

const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, "");
const allowedOriginsFromEnv = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const localDevOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

const allowedOrigins = [...new Set([...allowedOriginsFromEnv, ...localDevOrigins])];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "URL Shortener API is running",
        docs: {
            auth: "/api/auth",
            shorten: "/shorten"
        }
    });
});

app.use("/", urlRoutes);
app.use("/api/auth", authRoutes);

export default app;

export async function startServer() {
    const PORT = process.env.PORT || 5000;
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

if (process.env.VERCEL !== "1") {
    startServer().catch((err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
}