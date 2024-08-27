var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
const MongoStore = require('connect-mongo');
const ensureAuthenticated = require('../myapp/middleware/authController');

require('dotenv').config();

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// add react SPA
// app.use('/reactSPA', express.static(path.join(__dirname, 'frontend/my-react-app/build')));

// passport
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  // DONE: добавить возможность взаимодействия с БД

  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, // MongoDB connection string
    collectionName: 'sessions' // Collection to store session data
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
    httpOnly: true // Prevents client-side JS from accessing the cookie
  }
}));
app.use(passport.authenticate('session'));

app.use('/', indexRouter);
app.use('/users', ensureAuthenticated, usersRouter);
app.use('/', loginRouter);
app.use('/', logoutRouter);

// Fallback to serve index.html for any unknown route under /reactSPA
// app.get('/reactSPA/*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'frontend/my-react-app/build', 'index.html'));
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
