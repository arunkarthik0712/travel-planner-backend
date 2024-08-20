const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Accommodation = require("../models/Accommodation");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/book", authMiddleware, async (req, res) => {
  const {
    userId,
    accommodationId,
    numberOfMembers,
    checkInDate,
    checkOutDate,
  } = req.body;

  try {
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      return res.status(404).json({ message: "Accommodation not found" });
    }

    const totalPrice = accommodation.pricePerBed * numberOfMembers;

    const booking = new Booking({
      userId,
      accommodationId,
      numberOfMembers,
      totalPrice,
      checkInDate,
      checkOutDate,
    });

    await booking.save();

    const user = await User.findById(userId);

    console.log(user);
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
        subject: "Booking Confirmation",
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Booking Confirmation</h1>
          <p>Dear ${user.username},</p>
          <p>We are pleased to confirm your booking for <strong>${
            accommodation.name
          }</strong>.</p>
          <p><strong>Location:</strong> ${accommodation.location}</p>
          <p><strong>Number of Members:</strong> ${numberOfMembers}</p>
          <p><strong>Check-in Date:</strong> ${new Date(
            checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out Date:</strong> ${new Date(
            checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Total Price:</strong> $${totalPrice}</p>
          <p>Thank you for choosing our service! If you have any questions or need further assistance, feel free to contact us.</p>
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

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Cancel a booking
router.delete("/:bookingId/cancel", authMiddleware, async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Find the booking and populate the user and accommodation details
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("accommodationId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Prepare and send the cancellation email
    if (booking.userId) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: "no-reply@travelplanner.com",
        to: booking.userId.email,
        subject: "Booking Cancellation",
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancellation</title>
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Booking Cancellation</h1>
          <p>Dear ${booking.userId.username},</p>
          <p>We regret to inform you that your booking for <strong>${booking.accommodationId?.name}</strong> has been canceled.</p>
          <p><strong>Location:</strong> ${booking.accommodationId?.location}</p>
          <p><strong>Number of Members:</strong> ${booking.numberOfMembers}</p>
          <p><strong>Total Price:</strong> $${booking.totalPrice}</p>
          <p>We apologize for any inconvenience caused.</p>
        </div>
      </div>
    </body>
    </html>
  `,
      };

      // Send the email
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res
            .status(500)
            .json({ message: "Failed to send cancellation email" });
        }
        console.log("Email sent:", info.response);

        // Delete the booking after the email is sent
        try {
          await Booking.findByIdAndDelete(bookingId);
          res.json({ message: "Booking canceled successfully" });
        } catch (deleteError) {
          console.error("Error deleting booking:", deleteError);
          res.status(500).json({ message: "Failed to delete booking" });
        }
      });
    } else {
      // If no user, just delete the booking without sending an email
      try {
        await Booking.findByIdAndDelete(bookingId);
        res.json({ message: "Booking canceled successfully" });
      } catch (deleteError) {
        console.error("Error deleting booking:", deleteError);
        res.status(500).json({ message: "Failed to delete booking" });
      }
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: error.message });
  }
});

// Fetch bookings by userId
router.get("/user/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({ userId }).populate("accommodationId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
