var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  res.render('login/forgot', {
    projectName: "Guser"
  });
});

module.exports = router;
