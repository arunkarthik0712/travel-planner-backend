const express = require("express");
const axios = require("axios");
const router = express.Router();
const Destination = require("../models/Destination");

router.get("/", async (req, res) => {
  try {
    const { sortOrder = "asc" } = req.query;

    // Validate sortOrder
    if (!["asc", "desc"].includes(sortOrder)) {
      return res.status(400).json({ message: "Invalid sortOrder parameter" });
    }

    const sortOptions = { price: sortOrder === "asc" ? 1 : -1 };

    const destinations = await Destination.find().sort(sortOptions);
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const popularDestinations = [
  "Eiffel Tower, Paris",
  "Great Wall of China, Beijing",
  "Machu Picchu, Peru",
  "Grand Canyon, Arizona",
  "Sydney Opera House, Sydney",
  "Taj Mahal, Agra",
  "Santorini, Greece",
  "Mount Fuji, Japan",
  "Colosseum, Rome",
  "Niagara Falls, Canada",
];

// Fetch popular destinations from the database
router.get("/popular", async (req, res) => {
  try {
    const popularDestinations = await Destination.find({ popular: true }).limit(
      9
    );
    res.json(popularDestinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch a single destination by ID
router.get("/:id", async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination)
      return res.status(404).json({ message: "Destination not found" });

    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
