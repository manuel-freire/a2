var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Gleaner Users',
        projectName: 'Guser',
        copyrightYear: 2015,
        copyrightName: 'e-UCM'
    });
});

module.exports = router;
