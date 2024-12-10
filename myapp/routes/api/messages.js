const express = require('express');
const router = express.Router();
const Message  = require('../../models/userDataSchema').MessageHistory;

// Route to save a message
router.post('/send', async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();
    res.status(201).json({ success: true, message: 'Message saved' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
