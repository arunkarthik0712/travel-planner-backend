const express = require("express");
const router = express.Router();
const TravelPlan = require("../models/TravelPlan");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Create a new travel plan
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newPlan = new TravelPlan({ ...req.body, user: req.user._id });
    const savedPlan = await newPlan.save();

    const populatedPlan = await TravelPlan.findById(savedPlan._id)
      .populate("destinationId")
      .exec();

    const user = await User.findById(req.user._id);

    if (user) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: "no-reply@travelplanner.com",
        to: user.email,
        subject: "Travel Plan Created",
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Travel Plan Created</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header img {
          max-width: 150px;
        }
        .content {
          margin-bottom: 20px;
        }
        .content h1 {
          font-size: 18px;
          color: #333333;
          margin-bottom: 10px;
        }
        .content p {
          font-size: 14px;
          color: #666666;
          line-height: 1.6;
        }
        .content .details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-top: 10px;
        }
        .details p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Your Travel Plan Has Been Created</h1>
          <p>Dear ${user.username},</p>
          <p>We’re excited to inform you that your travel plan for <strong>${
            populatedPlan.destinationId.name
          }</strong> has been created successfully.</p>
          <div class="details">
            <p><strong>Schedule:</strong> ${savedPlan.schedule}</p>
            <p><strong>Activities:</strong> ${savedPlan.activities}</p>
            <p><strong>To-Do List:</strong> ${savedPlan.toDoList}</p>
            <p><strong>Budget:</strong> $${savedPlan.budget}</p>
            <p><strong>Start Date:</strong> ${new Date(
              savedPlan.startDate
            ).toDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(
              savedPlan.endDate
            ).toDateString()}</p>
          </div>
          <p>Thank you for using our travel planner! We hope you have a wonderful trip.</p>
        </div>
      </div>
    </body>
    </html>
  `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log("Email sent: " + info.response);
      });
    }

    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all travel plans
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    console.log("User from authMiddleware:", req.user); // Ensure this is correct
    const plans = await TravelPlan.find({ userId: req.user._id }).populate(
      "destinationId"
    ); // Use userId in query
    console.log("Plans response:", plans); // Check the retrieved plans
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching travel plans:", error);
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { schedule, activities, toDoList, budget, startDate, endDate } =
      req.body;

    const travelPlan = await TravelPlan.findByIdAndUpdate(
      req.params.id,
      { schedule, activities, toDoList, budget, startDate, endDate },
      { new: true }
    );

    if (!travelPlan)
      return res.status(404).json({ message: "Travel Plan not found" });

    res.json(travelPlan);
  } catch (error) {
    console.error("Error updating travel plan:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a travel plan
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Fetch the travel plan before deleting
    const travelPlan = await TravelPlan.findById(req.params.id)
      .populate("userId") // Populate the userId field to get user details
      .populate("destinationId") // Populate destinationId if needed
      .exec();

    if (!travelPlan)
      return res.status(404).json({ message: "Travel Plan not found" });

    // Ensure user details are available
    if (!travelPlan.userId || !travelPlan.userId.email) {
      throw new Error("User email not found");
    }

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Define email options
    const mailOptions = {
      from: "no-reply@travelplanner.com",
      to: travelPlan.userId.email,
      subject: "Travel Plan Deleted",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Travel Plan Deleted</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header img {
          max-width: 150px;
        }
        .content {
          margin-bottom: 20px;
        }
        .content h1 {
          font-size: 18px;
          color: #333333;
          margin-bottom: 10px;
        }
        .content p {
          font-size: 14px;
          color: #666666;
          line-height: 1.6;
        }
        .content .details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-top: 10px;
        }
        .details p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Your Travel Plan Has Been Deleted</h1>
          <p>Dear ${travelPlan.userId.username},</p>
          <p>We regret to inform you that your travel plan for <strong>${
            travelPlan.destinationId.name
          }</strong> has been deleted successfully.</p>
          <div class="details">
            <p><strong>Schedule:</strong> ${travelPlan.schedule}</p>
            <p><strong>Activities:</strong> ${travelPlan.activities}</p>
            <p><strong>To-Do List:</strong> ${travelPlan.toDoList}</p>
            <p><strong>Budget:</strong> $${travelPlan.budget}</p>
            <p><strong>Start Date:</strong> ${new Date(
              travelPlan.startDate
            ).toDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(
              travelPlan.endDate
            ).toDateString()}</p>
          </div>
          <p>We are sorry to see your plan go.</p>
        </div>
      </div>
    </body>
    </html>
  `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Delete the travel plan after sending the email
    await TravelPlan.findByIdAndDelete(req.params.id);

    // Respond with a success message
    res.json({ message: "Travel Plan deleted" });
  } catch (error) {
    console.error("Error processing request:", error);

    // Handle errors based on whether the email was sent or not
    if (error.responseCode === 550) {
      // Email sending failed
      res.status(500).json({ message: "Failed to send confirmation email" });
    } else {
      // General error
      res.status(500).json({ message: error.message });
    }
  }
});

module.exports = router;
