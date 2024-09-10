function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next(); // The user is authenticated, allow access to the route
    }
    // The user is not authenticated, redirect to the login page
    res.redirect('/login');
  }

module.exports = ensureAuthenticated;