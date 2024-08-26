var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // TODO: check if user is loged in
  // if NOT Loged in - redirect
  // res.redirect('/login');
  // else:
  res.render('index', { title: 'Express' });
});

// router.get('/oauth2/redirect/google', function(req, res, next) {
//   res.redirect('/');
// })

module.exports = router;
