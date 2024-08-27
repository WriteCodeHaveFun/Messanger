var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // DONE: check if user is loged in
  if (req.isAuthenticated()) {
    res.render('index', { title: 'Express' });
  } else {
    res.redirect('/login');
  }
});

module.exports = router;
