import dotenv from "dotenv";
import app from "../server.js";
import connectDB from "../config/db.js";

dotenv.config();

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
