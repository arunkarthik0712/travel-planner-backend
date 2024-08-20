const mongoose = require("mongoose");

const travelPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  destinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Destination",
    required: true,
  },
  schedule: { type: String, required: true },
  activities: { type: String, required: true },
  toDoList: { type: String, required: true },
  budget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const TravelPlan = mongoose.model("TravelPlan", travelPlanSchema);

module.exports = TravelPlan;
