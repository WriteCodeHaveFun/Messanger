var createError = require('http-errors');
var express = require('express');
var path = require('path');
const fs = require('fs');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
const MongoStore = require('connect-mongo');
const ensureAuthenticated = require('../myapp/middleware/authController');
const ensureContactAvailable = require('../myapp/middleware/contactAccessController')
const { Server } = require('socket.io'); // Import Socket.IO
const http = require('http'); // Required for creating an HTTP server with Socket.IO
require('dotenv').config();

const MessageHistory = require('./models/userDataSchema').MessageHistory;
const User = require('./models/userDataSchema').User;

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
const apiCurrentUser = require('./routes/api/currentUser');
const apiContactList = require('./routes/api/contactList');
const messageRouter = require('./routes/api/messages');


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

app.use('/', loginRouter); // TODO: if user already logged in and go to /login, redirect to /
// app.use('/', ensureAuthenticated, indexRouter);
app.use('/', ensureAuthenticated, logoutRouter);

// add react SPA
app.use('/', ensureAuthenticated, express.static(path.join(__dirname, 'frontend/messanger_frontend/dist')));

app.use('/users', ensureAuthenticated, usersRouter);
app.use('/addUser', ensureAuthenticated, addUser);

// api
app.use('/api/currentUser', ensureAuthenticated, apiCurrentUser);
app.use('/api/contactList', ensureAuthenticated, apiContactList);
app.use('/api/messages', ensureAuthenticated, messageRouter);

app.get('/api/chatHistory/:contactName', ensureAuthenticated, ensureContactAvailable, async (req, res) => {
  const currentUser = req.user?.name; // Assuming user is authenticated
  const { contactName } = req.params;

  try {
      // Retrieve the chat history between the current user and the contact
      const chatHistory = await MessageHistory.find({
          $or: [
              { sender: currentUser, receiver: contactName },
              { sender: contactName, receiver: currentUser }
          ]
      }).sort({ timestamp: 1 }); // Sort by timestamp ascending

      res.json({ success: true, chatHistory });
  } catch (error) {
      console.error('Error retrieving chat history:', error);
      res.status(500).json({ success: false, error: 'Server error' });
  }
});

// TODO: remove body of function outside
app.get('/api/userStatus/:username', /*ensureAuthenticated, ensureContactAvailable,*/ async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ name: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      online: user.online,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/deleteChatHistory/:contactName', ensureAuthenticated, ensureContactAvailable, async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    await MessageHistory.deleteMany({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    res.status(200).json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

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
// const Message = mongoose.model('Message', MessageSchema);

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

// !! send file
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadDir));

// !!!
// Next version:

// WebSocket setup in app.js
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentUserName;

  // Join a user to a specific chat room based on sender and receiver
  socket.on('joinRoom', ({ sender, receiver }) => {
    currentUserName = sender; // init currentUserName (i'll need it for socket.on('disconnect'))
    // Create a unique room for the sender and receiver pair
    const roomName = [sender, receiver].sort().join('_'); // Sorting ensures unique room name for each pair
    socket.join(roomName);

    console.log(`${sender} joined room: ${roomName}`);
  });

  // Событие "печатает"
  socket.on('typing', ({ sender, receiver }) => {
    const room = [sender, receiver].sort().join('_');
    socket.to(room).emit('typing', { sender });
  });

  // Событие "перестал печатать"
  socket.on('stopTyping', ({ sender, receiver }) => {
    const room = [sender, receiver].sort().join('_');
    socket.to(room).emit('stopTyping', { sender });
  });

  // Handle `sendMessage` event for message transmission
  socket.on('sendMessage', async ({ sender, receiver, content, file, messageID }) => {

    // Define the room name the same way as in `joinRoom`
    const roomName = [sender, receiver].sort().join('_');
    io.to(roomName).emit('receiveMessage', { sender, content, file, messageID, timestamp: new Date(), status: 'delivered' });
  });

  // Handle 'delivered/read' functionality
  socket.on('messageRead', async ({ ids, sender, receiver }) => {
    try {
      await MessageHistory.updateMany(
        { 
          //_id: { $in: ids }, 
          sender, receiver, status: 'delivered' },
        { $set: { status: 'read' } }
      );

      const roomName = [sender, receiver].sort().join('_');
      io.to(roomName).emit('messageStatusUpdate', { ids, status: 'read' });      
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  });
  

  // Mark user as online
  socket.on('setUserOnline', async ({ username }) => {
    try {
      await User.updateOne(
        { name: username },
        { $set: { online: true } }
      );
      // TODO: now it's not working right. Try to replace next line with: io.to(roomName).emit(...)
      socket.broadcast.emit('userStatusUpdate', { username, online: true });
    } catch (err) {
      console.error('Error setting user online:', err);
    }
  });

  // Handle disconnection or inactivity
  const setOffline = async (username) => {
    try {
      await User.updateOne(
        { name: username },
        { $set: { online: false, lastSeen: new Date() } }
      );
      socket.broadcast.emit('userStatusUpdate', {
        username,
        online: false,
        lastSeen: new Date(),
      });
    } catch (err) {
      console.error('Error setting user offline:', err);
    }
  };

  // Inactivity timer
  // let afkTimer;
  socket.on('setAfk', async ({ username }) => {
    setOffline(username);
    // clearTimeout(afkTimer);
    // afkTimer = setTimeout(() => setOffline(username), 60000); // 1 min
  });

  // Handle chat history deletion
  socket.on('deleteChatHistory', ({ sender, receiver }) => {
    const roomName = [sender, receiver].sort().join('_');
    io.to(roomName).emit('chatHistoryDeleted', { sender, receiver }); // Notify both users in the chat room
  });

  // Handle client disconnect
  socket.on('disconnect', async () => {
    // const username = socket.handshake.query.username; // Ensure username is passed in query
    console.log("username: ", currentUserName);
    await setOffline(currentUserName); // TODO: now username is undefined
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