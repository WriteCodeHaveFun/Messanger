const asyncHandler = require("express-async-handler");

exports.login_get = asyncHandler(async (req, res, next) => {
    // res.send("NOT IMPLEMENTED: login GET");
    // DONE: render login template
    res.render('login', { title: 'Login'} );
});

exports.login_post = asyncHandler(async (req, res, next) => {
    // TODO: login and sign in functionality
    const { action } = req.body;

    if (action === 'login') {
        // Handle login
        res.send("NOT IMPLEMENTED: login POST");
    } else if (action === 'sign_in') {
        // Handle sign in
        res.send("NOT IMPLEMENTED: sign in POST");
    } else {
        // Handle other cases or show an error
        res.send('Invalid action');
    }
});