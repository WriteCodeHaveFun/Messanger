var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.json({ success: true, user: req.user });
});

module.exports = router;