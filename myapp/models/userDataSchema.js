const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  password: {
    type: String, // Define the type as String
    required: false, // Explicitly mark as not required (optional)
  },
});

const federatedCredentialSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  provider: String,
  subject: String
});

const contactListSchema = new mongoose.Schema({
  currentUserName: String,
  contactList: array // ! я не знаю, как правильно записать эту строку
});

module.exports = {
    User: mongoose.model('User', userSchema),
    FederatedCredential: mongoose.model('FederatedCredential', federatedCredentialSchema)
};