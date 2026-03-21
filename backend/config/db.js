import mongoose from "mongoose";

let connectionPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri)
      .then((conn) => {
        console.log("MongoDB Connected");
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
};

export default connectDB;
