const ContactList = require('../models/userDataSchema').ContactList;

// Middleware to check if the user is authenticated and has the contact in their list
const checkContactAccess = async (req, res, next) => {
  try {

    const currentUserName = req.user.name;
    const { contactName } = req.params; // Assuming the route has a param for the contact name

    // Find the user's contact list in the database
    const contactList = await ContactList.findOne({ currentUserName });

    // Check if the contact exists in the user's contact list
    const contactExists = contactList?.contactList.some((contact) => contact.name === contactName);

    if (!contactExists) {
      return res.status(404).send('Page not found');
    }

    // If everything is fine, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Error in checkContactAccess middleware:', error);
    res.status(500).send('Server error');
  }
};

module.exports = checkContactAccess;
