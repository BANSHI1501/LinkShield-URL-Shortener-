import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import urlRoutes from "./routes/urlRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", urlRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => console.log(err));
import authRoutes from "./routes/authRoutes.js";

app.use("/api/auth", authRoutes);