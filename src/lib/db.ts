import mongoose from "mongoose";

// Reuse one connection across hot reloads and serverless invocations.
const cache = globalThis as unknown as { _mongoose?: Promise<typeof mongoose> };

export function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGODB_URI is not set. Add it to .env.local."));
  }
  if (!cache._mongoose) {
    cache._mongoose = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        cache._mongoose = undefined;
        throw err;
      });
  }
  return cache._mongoose;
}
