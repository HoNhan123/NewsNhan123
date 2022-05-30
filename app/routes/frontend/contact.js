var express = require('express');
var router = express.Router();

const folderView	 = __path_views_front + 'pages/contact/';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render(`${folderView}contact`, { pageTitle   : 'ContactPage ',layout: __path_views_front +'front' });
});

module.exports = router;
