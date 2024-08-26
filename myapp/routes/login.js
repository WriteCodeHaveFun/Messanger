const express = require("express");
const router = express.Router();

require('dotenv').config();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

const loginController = require('../controllers/loginController')

router.get('/login', loginController.login_get);
router.post('/login', loginController.login_post);

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/login/oauth2/redirect/google',
  scope: ['profile']
}, function verify(issuer, profile, cb) {
  // TODO: добавить возможность взаимодействия с БД
  // Проверяем, существует ли уже пользователь в текущей сессии
  if (profile) {
    // Создаем объект пользователя без взаимодействия с базой данных
    const user = {
      id: profile.id,
      name: profile.displayName,
      provider: issuer,
      profilePicture: profile.photos[0]?.value
    };
    return cb(null, user);
  } else {
    return cb(null, false, { message: 'Failed to authenticate user' });
  }
}));

// Сериализация пользователя в сессию
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

// Десериализация пользователя из сессии
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// passport.serializeUser(function(user, cb) {
//     process.nextTick(function() {
//       cb(null, { id: user.id, username: user.username, name: user.name });
//     });
//   });
  
// passport.deserializeUser(function(user, cb) {
//     process.nextTick(function() {
//         return cb(null, user);
//     });
// });


router.get('/login/auth/google', 
    passport.authenticate('google')
);

// Маршрут для обработки редиректа от Google после аутентификации
router.get('/login/oauth2/redirect/google', 
  loginController.logged_in_succesful
    // TODO: next code doesn't work. Maybe it'll work after I add real DB as storage for user data
    // passport.authenticate('google', {
    //   successRedirect: '/',
    //   failureRedirect: '/login',
    // })
);

module.exports = router;