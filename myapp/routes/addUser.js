var express = require('express');
var router = express.Router();
const { User, ContactList } = require('../models/userDataSchema');

// Route to handle adding or finding a user
router.post('/', async function(req, res) {
  const { name } = req.body;
  const currentUserName = req.user.name; // Получаем текущего пользователя из сессии

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Найти пользователя по имени
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Проверить контактный список текущего пользователя
    let contactList = await ContactList.findOne({ currentUserName });

    if (!contactList) {
      // Если списка нет, создаем новый
      contactList = new ContactList({ currentUserName, contactList: [] });
    }

    // Проверить, есть ли пользователь уже в списке
    const alreadyInList = contactList.contactList.some(
      (contact) => contact.name === name
    );

    if (alreadyInList) {
      return res.json({ success: false, error: 'User already in contact list' });
    }

    // Добавляем пользователя в контактный список
    contactList.contactList.push({ name });
    await contactList.save();

    return res.json({ success: true, message: 'User added to contact list', user });
  } catch (error) {
    console.error('Error updating contact list:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
