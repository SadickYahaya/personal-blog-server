const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const createTransporter = require('../helpers/emailService');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    // Send notification email
    await sendNotificationEmail(email);

    res.status(201).json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to send notification email
async function sendNotificationEmail(subscriberEmail) {
  try {
    let transporter = createTransporter();

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            h1 {
              color: #2c3e50;
            }
            .highlight {
              color: #e74c3c;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>New Newsletter Subscription</h1>
            <p>Great news! A new user has subscribed to your newsletter:</p>
            <p class="highlight">${subscriberEmail}</p>
            <p>Keep creating great content for your growing audience!</p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: 'New Newsletter Subscription',
      text: `A new user has subscribed to your newsletter: ${subscriberEmail}`,
      html: htmlContent,
    });

    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

// Get all subscribers (protected route, add authentication middleware as needed)
router.get('/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().select('-__v');
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsubscribe route
router.get('/unsubscribe/:id', async (req, res) => {
  try {
    const result = await Subscriber.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send('Subscriber not found');
    }
    res.send('You have been successfully unsubscribed');
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).send('An error occurred while unsubscribing');
  }
});

// New route for unsubscribing
router.delete('/unsubscribe/:id', async (req, res) => {
  try {
    const result = await Subscriber.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }
    res.json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'An error occurred while unsubscribing' });
  }
});

module.exports = router;