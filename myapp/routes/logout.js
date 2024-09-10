const express = require("express");
const router = express.Router();

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { 
        return next(err); 
    }
    res.send('Logout succesful')
  });
});

module.exports = router;