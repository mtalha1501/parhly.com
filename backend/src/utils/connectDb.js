const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

let cached = null;

async function connectDb() {
  if (cached) return cached;

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGODB_URI (or MONGO_URI) env var");

  mongoose.set("strictQuery", true);
  cached = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    })
    .then((conn) => {
      console.log("Connected to MongoDB");
      return conn;
    })
    .catch((err) => {
      cached = null;
      throw err;
    });

  return cached;
}

module.exports = { connectDb };
