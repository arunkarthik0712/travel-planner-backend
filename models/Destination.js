const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  popular: { type: Boolean, default: false }, // To mark popular destinations
});

const Destination = mongoose.model("Destination", destinationSchema);

module.exports = Destination;
