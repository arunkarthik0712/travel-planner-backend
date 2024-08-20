const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

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
      subject: "Account Activation",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Activation</title>
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
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #28a745;
          color: #ffffff;
          text-decoration: none;
          font-weight: bold;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Account Activation</h1>
          <p>Hi ${user.username},</p>
          <p>Thank you for signing up with Travel Planner! To activate your account, please click the button below:</p>
          <a href="${process.env.CLIENT_URL}/activate/${generateToken(
        user._id
      )}" class="button">Activate Account</a>
          <p>If you did not create an account with us, please ignore this email.</p>
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

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      message: "Registration Successful. Check email for activation",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const activateUser = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({ message: "Account activated successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(400).json({ message: "Account is not activated" });
      }
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = generateToken(user._id);

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
      subject: "Password Reset Request",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
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
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          font-weight: bold;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://drive.google.com/uc?export=view&id=1qaAGZwoHwVy8I17q2tRBGZu2moTCldl3" alt="Travel Planner">
        </div>
        <div class="content">
          <h1>Password Reset Request</h1>
          <p>Hi ${user.username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" class="button">Reset Password</a>
          <p>If you did not request this change, please ignore this email. Your password will not be changed.</p>
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

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

const getUserDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  activateUser,
  authUser,
  forgotPassword,
  resetPassword,
  getUserDetails,
};
