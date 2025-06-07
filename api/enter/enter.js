import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const TwinkleSchema = new mongoose.Schema({
  name: String,
  username: String,
  coins: String,
  rewardCount: Number,
  spinCount: Number,
  inviteFriends: Boolean,
});

const Twinkle = mongoose.models.Twinkle || mongoose.model("Twinkle", TwinkleSchema, "profiles");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();
  const { username } = req.body;

  try {
    const user = await Twinkle.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const currentCoins = parseInt(user.coins || "0");
    if (currentCoins >= 100) {
      user.coins = (currentCoins - 100).toString();
      await user.save();
      return res.json({ success: true, message: "Access granted! ✅ 100 coins deducted." });
    } else {
      return res.status(403).json({ success: false, message: "Not enough coins to enter ❌" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
