var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('signup', {
    projectName: "Guser"
  });
});

module.exports = router;
