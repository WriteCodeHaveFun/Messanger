const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: String,
//   password: {
//     type: String,
//     required: false, // Пароль может быть не обязательным
//   },
// });

const userSchema = new mongoose.Schema({
  name: String,
  password: {
    type: String,
    required: false, // Пароль может быть не обязательным
  },
  online: {
    type: Boolean,
    default: false, // Default to offline
  },
  lastSeen: {
    type: Date,
    default: null, // No activity yet
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

// const messageHistorySchema = new mongoose.Schema({
//   sender: {
//     type: String,
//     required: true,
//   },
//   receiver: {
//     type: String,
//     required: true,
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
// });

const messageHistorySchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  content: String, // Optional for file messages
  file: {
    filename: String, // Name of the file
    mimetype: String, // File MIME type
    path: String, // Path where the file is stored
  },
  status: {
    type: String, 
    enum: ['delivered', 'read'], 
    default: 'delivered',
  },
  messageID: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  User: mongoose.model('User', userSchema),
  FederatedCredential: mongoose.model('FederatedCredential', federatedCredentialSchema),
  ContactList: mongoose.model('ContactList', contactListSchema), // Добавляем модель для контактов
  MessageHistory: mongoose.model('MessageHistory', messageHistorySchema),
};
