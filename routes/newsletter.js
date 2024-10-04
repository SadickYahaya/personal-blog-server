const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    res.status(201).json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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