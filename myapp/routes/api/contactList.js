var express = require('express');
var router = express.Router();
const ContactList = require('../../models/userDataSchema').ContactList;

router.get('/', async (req, res) => {
  const currentUserName = req.user.name;

  try {
    const contactList = await ContactList.findOne({ currentUserName });

    if (!contactList) {
      return res.json({ success: true, contacts: [] });
    }

    return res.json({ success: true, contacts: contactList.contactList });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
