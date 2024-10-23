var express = require('express');
var router = express.Router();
const User = require('../models/userDataSchema').User; // Assuming you have a model named ChatUser

// Route to handle adding or finding a user
router.post('/', async function(req, res) {
  const { name } = req.body; // Get the name from the request body

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Search for the user in the database by name
    const user = await User.findOne({ name });

    if (user) {
      // If the user is found, return a success response
      return res.json({ success: true, message: 'User found', user });
    } else {
      // If the user is not found, return an error
      return res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    // If there is an error with the database query, return a server error
    console.error('Error finding user:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
