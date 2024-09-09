const express = require("express");
const router = express.Router();

require('dotenv').config();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

const loginController = require('../controllers/loginController');
const { User, FederatedCredential } = require('../models/userDataSchemaGoogle');


router.get('/login', loginController.login_get);
router.post('/login', loginController.login_post);

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/login/oauth2/redirect/google',
  scope: ['profile']
},  async function(accessToken, refreshToken, profile, cb) {
  try {
    // Find the federated credential
    let credential = await FederatedCredential.findOne({ provider: profile.provider, subject: profile.id });

    if (!credential) {
      // If the credential doesn't exist, create a new user and credential
      let user = new User({ name: profile.displayName });
      await user.save();

      credential = new FederatedCredential({
        userId: user._id,
        provider: profile.provider,
        subject: profile.id
      });
      await credential.save();

      return cb(null, user);
    } else {
      // If the credential exists, find the associated user
      let user = await User.findById(credential.userId);
      if (!user) {
        return cb(null, false);
      }
      return cb(null, user);
    }
  } catch (err) {
    return cb(err);
  }
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});


router.get('/login/auth/google', 
    passport.authenticate('google')
);

// Маршрут для обработки редиректа от Google после аутентификации
router.get('/login/oauth2/redirect/google', 
    // DONE: next code doesn't work. Maybe it'll work after I add real DB as storage for user data
    passport.authenticate('google', {
      successRedirect: '/',
      failureRedirect: '/login',
    })
);

module.exports = router;