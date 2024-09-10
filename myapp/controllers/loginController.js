const asyncHandler = require("express-async-handler");

const express = require('express');
const bcrypt = require('bcrypt'); // To hash passwords
const { User } = require('../models/userDataSchema'); // Import the User model
// const router = express.Router();
const passport = require('passport');


exports.login_get = asyncHandler(async (req, res, next) => {
    // DONE: render login template
    res.render('login', { title: 'Login'} );
});

exports.login_post = asyncHandler(async (req, res, next) => {
    const { action, username, password } = req.body; // Make sure you are reading the correct input names
  
    if (action === "login") {
      // Handle login via passport
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(400).send(info.message); // Authentication failed
        }
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          // Successful login, redirect to the main page
          return res.redirect("/");
        });
      })(req, res, next);
    } else if (action === "sign_in") {
      // Handle sign in (new user registration)
      try {
        // Validate input
        if (!username || !password) {
          return res.status(400).send("Username/Email and Password are required");
        }
  
        // Check if user already exists
        const existingUser = await User.findOne({ name: username });
        if (existingUser) {
          return res.status(400).send("User already exists");
        }
  
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Create a new user
        const newUser = new User({
          name: username,
          password: hashedPassword,
        });
  
        await newUser.save();
  
        // Auto login after sign in
        req.login(newUser, (err) => {
          if (err) return next(err);
          // Redirect to the main page after successful sign in
          return res.redirect("/");
        });
      } catch (error) {
        next(error);
      }
    } else {
      res.send("Invalid action");
    }
  });