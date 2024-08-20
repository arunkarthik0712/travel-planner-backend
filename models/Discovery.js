// models/Discovery.js
const mongoose = require("mongoose");

const DiscoverySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ url: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      text: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Discovery = mongoose.model("Discovery", DiscoverySchema);
module.exports = Discovery;
