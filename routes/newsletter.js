const express = require("express");
const router = express.Router();
const Subscriber = require("../models/Subscriber");
const createTransporter = require("../helpers/emailService");

// Function to send notification email (to admin or another recipient)
async function sendNotificationEmail(subscriberEmail) {
  try {
    let transporter = createTransporter();

    const htmlContent = `
      <html>
        <body>
          <h1>New Subscription Alert!</h1>
          <p>A new user has subscribed with the email: ${subscriberEmail}</p>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Replace with the admin's email address
      subject: 'New Subscriber Notification',
      text: `A new user has subscribed with the email: ${subscriberEmail}`,
      html: htmlContent,
    });

    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

// Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    // Send notification email to admin
    await sendNotificationEmail(email); // Ensure this function is defined

    // Send confirmation email to the subscriber
    await sendConfirmationEmail(email);

    res
      .status(201)
      .json({ message: "Successfully subscribed to the newsletter" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Server error" });
  }
});

async function sendConfirmationEmail(subscriberEmail) {
  try {
    let transporter = createTransporter();

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #007BFF;">Welcome to My Tech Blog!</h1>
            <p>🚀 Thank you for subscribing!</p>
            <p>You’re officially part of a vibrant community passionate about all things tech. Whether you're a seasoned developer or just curious about the latest trends, there's something here for everyone!</p>
            <p>Here's what you can look forward to:</p>
            <ul>
              <li>🌟 Insightful articles on software development, tools, and best practices.</li>
              <li>🔍 Exclusive tips and tricks to help you level up your coding skills.</li>
              <li>💬 Engaging discussions on the latest tech trends and innovations.</li>
            </ul>
            <p>If there are specific topics you’re eager to learn about, or if you have any feedback, I’d love to hear from you. Your insights will help shape our future content!</p>
            <p style="margin-top: 30px;">Together, let’s explore the fascinating world of technology!</p>
            <p>Cheers,</p>
            <p>Sadick, your tech guide from Ghana</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">If you didn’t sign up for this newsletter, you can safely ignore this email or <a href="UNSUBSCRIBE_LINK" style="color: #007BFF;">unsubscribe</a>.</p>
            <p style="font-size: 12px; color: #777;">To ensure you receive our updates, please check your spam folder and mark this email as <strong>not spam</strong>.</p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: subscriberEmail,
      subject: "🚀 Welcome to My Tech Blog!",
      text: `Welcome to my tech blog, ${subscriberEmail}!

Thank you for subscribing! You’re officially part of a vibrant community passionate about all things tech. Whether you're a seasoned developer or just curious about the latest trends, there's something here for everyone!

Here’s what you can look forward to:
- 🌟 Insightful articles on software development, tools, and best practices.
- 🔍 Exclusive tips and tricks to help you level up your coding skills.
- 💬 Engaging discussions on the latest tech trends and innovations.

If there are specific topics you’re eager to learn about, or if you have any feedback, I’d love to hear from you. Your insights will help shape our future content!

Cheers,
Sadick, your tech guide from Ghana

(If you didn’t sign up for this newsletter, you can safely ignore this email or unsubscribe.)

To ensure you receive our updates, please check your spam folder and mark this email as **not spam**.`,
      html: htmlContent,
    });

    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

// Get all subscribers (protected route, add authentication middleware as needed)
router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().select("-__v");
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unsubscribe route
router.get("/unsubscribe/:id", async (req, res) => {
  try {
    const result = await Subscriber.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send("Subscriber not found");
    }
    res.send("You have been successfully unsubscribed");
  } catch (error) {
    console.error("Error unsubscribing:", error);
    res.status(500).send("An error occurred while unsubscribing");
  }
});

// New route for unsubscribing
router.delete("/unsubscribe/:id", async (req, res) => {
  try {
    const result = await Subscriber.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Subscriber not found" });
    }
    res.json({ message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    res.status(500).json({ message: "An error occurred while unsubscribing" });
  }
});

module.exports = router;
