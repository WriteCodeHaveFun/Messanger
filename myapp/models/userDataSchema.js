const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  password: {
    type: String,
    required: false, // Пароль может быть не обязательным
  },
});

const federatedCredentialSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  provider: String,
  subject: String,
});

const contactListSchema = new mongoose.Schema({
  currentUserName: {
    type: String,
    required: true,
  },
  contactList: [
    {
      name: String, // Имя контакта
      addedAt: {
        type: Date,
        default: Date.now, // Время добавления контакта
      },
    },
  ],
});

module.exports = {
  User: mongoose.model('User', userSchema),
  FederatedCredential: mongoose.model('FederatedCredential', federatedCredentialSchema),
  ContactList: mongoose.model('ContactList', contactListSchema), // Добавляем модель для контактов
};
