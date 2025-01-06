const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Message = require('../../models/userDataSchema').MessageHistory;

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the "uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route to save a message with or without a file
router.post('/send', upload.single('file'), async (req, res) => {
  const { sender, receiver, content } = req.body;
  const file = req.file;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      content: content || null,
      file: file
        ? {
            filename: file.filename,
            mimetype: file.mimetype,
            path: file.path,
          }
        : null,
      status: 'delivered', // Set initial status as "delivered"
    });
    await newMessage.save();
    res.status(201).json({ success: true, message: 'Message saved' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Serve uploaded files
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;
