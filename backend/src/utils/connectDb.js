const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGODB_URI (or MONGO_URI) env var");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
  });
  console.log("Connected to MongoDB");
}

module.exports = { connectDb };
