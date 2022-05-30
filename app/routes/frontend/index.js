var express = require('express');
var router = express.Router();

const CategoryModel 	= require(__path_schemas + 'category');
const arr = ['bussiness','technology']

router.use('/', require('./home'));
router.use('/singlePage', require('./singlePage'));
router.use('/contact', require('./contact'));


module.exports = router;
