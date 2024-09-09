const asyncHandler = require("express-async-handler");

const express = require('express');
const bcrypt = require('bcrypt'); // To hash passwords
const User = require('../models/userDataSchemaStandart'); // Import the User model
const router = express.Router();

exports.login_get = asyncHandler(async (req, res, next) => {
    // res.send("NOT IMPLEMENTED: login GET");
    // DONE: render login template
    res.render('login', { title: 'Login'} );
});

exports.login_post = asyncHandler(async (req, res, next) => {
    // TODO: login and sign in functionality
    const { action, usernameOrEmail, password } = req.body;

    if (action === 'login') {
        // Handle login
        res.send("NOT IMPLEMENTED: login POST");
    } else if (action === 'sign_in') {
        // Handle sign in
        try {
            // Check if the user already exists
            const existingUser = await User.findOne({ usernameOrEmail });
            if (existingUser) {
              return res.status(400).send('User already exists. Please log in.');
            }
      
            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
      
            // Create a new user
            const newUser = new User({
              usernameOrEmail,
              password: hashedPassword,
            });
      
            // Save the user to the database
            await newUser.save();
      
            res.send('User registered successfully!'); // TODO: delete this
            // TODO: auto login and redirect to main page
            // res.redirect('/');
        } catch (error) {
            res.status(500).send('Error signing in user: ' + error.message);
        }
    } else {
        // Handle other cases or show an error
        res.send('Invalid action');
    }
});