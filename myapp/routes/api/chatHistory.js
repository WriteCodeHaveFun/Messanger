var express = require('express');
var router = express.Router();
const Message = require('../../models/userDataSchema').MessageHistory; // Import Message model

// Route to get chat history
router.get('/', async (req, res) => {
    const contactName = req.baseUrl.split('/').pop();
    const currentUser = req.user?.name; // Assuming user is authenticated

    try {
        // Retrieve the chat history between the current user and the contact
        const chatHistory = await Message.find({
            $or: [
                { sender: currentUser, receiver: contactName },
                { sender: contactName, receiver: currentUser }
            ]
        }).sort({ timestamp: 1 }); // Sort by timestamp ascending

        res.json({ success: true, chatHistory });
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Route to save a new message
// router.post('/send', async (req, res) => {
//     const { sender, receiver, content } = req.body;

//     try {
//         const newMessage = new Message({ sender, receiver, content });
//         await newMessage.save();
//         res.status(201).json({ success: true, message: 'Message saved' });
//     } catch (error) {
//         console.error('Error saving message:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

module.exports = router;
