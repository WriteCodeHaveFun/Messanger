var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
const MongoStore = require('connect-mongo');
const ensureAuthenticated = require('../myapp/middleware/authController');
const { Server } = require('socket.io'); // Import Socket.IO
const http = require('http'); // Required for creating an HTTP server with Socket.IO
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
const addUser = require('./routes/addUser');

var app = express();
var server = http.createServer(app); // Create HTTP server for Socket.IO
var io = new Server(server); // Initialize Socket.IO with the server

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, // MongoDB connection string
    collectionName: 'sessions' // Collection to store session data
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', loginRouter);
// app.use('/', ensureAuthenticated, indexRouter);
app.use('/', ensureAuthenticated, logoutRouter);

// add react SPA
app.use('/', ensureAuthenticated, express.static(path.join(__dirname, 'frontend/messanger_frontend/dist')));

app.use('/users', ensureAuthenticated, usersRouter);
app.use('/addUser', ensureAuthenticated, addUser);

// WebSocket logic
// TODO: move mongoose.Schema to 'models' folder
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const MessageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  timestamp: Date,
});
const ChatUser = mongoose.model('ChatUser', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Handle adding a new user
//   socket.on('addUser', async (data, callback) => {
//     try {
//       const existingUser = await ChatUser.findOne({ email: data.email });
//       if (existingUser) {
//         callback({ error: 'User already exists' });
//       } else {
//         const newUser = new ChatUser({ name: data.name, email: data.email });
//         await newUser.save();
//         callback({ success: 'User added successfully' });
//       }
//     } catch (error) {
//       callback({ error: 'Error adding user' });
//     }
//   });

//   // Handle messaging between users
//   socket.on('sendMessage', async ({ sender, receiver, content }) => {
//     const message = new Message({
//       sender,
//       receiver,
//       content,
//       timestamp: new Date(),
//     });
//     await message.save();

//     // Send message to the receiver if online
//     socket.broadcast.to(receiver).emit('receiveMessage', message);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// catch 404 and forward to error handler

//!!!
// Socket.IO setup for handling chat messages
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   // Listen for `sendMessage` event from the client
//   socket.on('sendMessage', (msg) => {
//     const { sender, receiver, content } = msg;

//     // Emit message to the specific receiver if connected, otherwise broadcast
//     io.emit('receiveMessage', { sender, content });
    
//     // In a production app, you'd likely use:
//     // io.to(receiver).emit('receiveMessage', { sender, content });
//   });

//   // Handle client disconnect
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// !!!
// Next version:

// WebSocket setup in app.js
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a user to a specific chat room based on sender and receiver
  socket.on('joinRoom', ({ sender, receiver }) => {
    // Create a unique room for the sender and receiver pair
    const roomName = [sender, receiver].sort().join('_'); // Sorting ensures unique room name for each pair
    socket.join(roomName);

    console.log(`${sender} joined room: ${roomName}`);
  });

  // Handle `sendMessage` event for message transmission
  socket.on('sendMessage', async ({ sender, receiver, content }) => {
    const message = new Message({
      sender,
      receiver,
      content,
      timestamp: new Date(),
    });
    await message.save(); // Save message to database

    // Define the room name the same way as in `joinRoom`
    const roomName = [sender, receiver].sort().join('_');
    io.to(roomName).emit('receiveMessage', { sender, content, timestamp: message.timestamp });
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Export server instead of app for WebSocket to work
module.exports = { app, server };