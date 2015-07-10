var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  res.render('login/reset', {
    projectName: "Guser"
  });
});

module.exports = router;
