const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String
});

const federatedCredentialSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  provider: String,
  subject: String
});

const User = mongoose.model('User', userSchema);
const FederatedCredential = mongoose.model('FederatedCredential', federatedCredentialSchema);
