var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/dashboard', require('./dashboard'));
router.use('/items', require('./items'));
router.use('/groups', require('./groups'));
router.use('/users', require('./users'));
router.use('/category', require('./category'));
router.use('/article', require('./article'));
router.use('/setting', require('./setting'));

module.exports = router;
