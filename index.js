const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const accommodationRoutes = require("./routes/accommodation");
const bookingRoutes = require("./routes/bookings");
const destinationRoutes = require("./routes/destinationRoutes");
const travelPlanRoutes = require("./routes/travelPlanRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const cloudinary = require("./cloudinaryConfig");
const upload = require("./multerCloudinary");

dotenv.config();

connectDB();

const app = express();

app.use(cors({ origin: "https://arunkarthik0710-travel-planner.netlify.app" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/accommodations", accommodationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/travel-plans", travelPlanRoutes);
app.use("/api/discoveries", discoveryRoutes);

app.post("/api/upload", upload.array("file", 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "uploads",
        resource_type: "auto",
      });

      if (result && result.secure_url) {
        uploadedUrls.push(result.secure_url);
      } else {
        return res
          .status(500)
          .json({ error: "Failed to upload to Cloudinary" });
      }
    }

    res.status(200).json({ urls: uploadedUrls });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Error uploading file" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
