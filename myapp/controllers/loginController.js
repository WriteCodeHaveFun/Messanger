const asyncHandler = require("express-async-handler");

exports.login_get = asyncHandler(async (req, res, next) => {
    // res.send("NOT IMPLEMENTED: login GET");
    // DONE: render login template
    res.render('login', { title: 'Login'} );
});

// TODO: delete next test
exports.login_test = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: login TEST");
});
exports.logged_in_succesful = asyncHandler(async (req, res, next) => {
    // res.send("NOT IMPLEMENTED: logged IN TEST");
    res.redirect('/');
});

exports.login_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: login POST");
    // TODO: login functionality
});