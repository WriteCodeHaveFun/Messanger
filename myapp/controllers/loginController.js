const asyncHandler = require("express-async-handler");

exports.login_get = asyncHandler(async (req, res, next) => {
    // res.send("NOT IMPLEMENTED: login GET");
    // DONE: render login template
    res.render('login', { title: 'Login'} );
});

exports.login_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: login POST");
    // TODO: login functionality
});