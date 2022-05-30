var express = require('express');
var router = express.Router();
const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const folderView	 = __path_views_front + 'pages/singlePage/';
const linkIndex		 = '/' + systemConfig.prefixAdmin + '/setting/';
const SettingModel 	= require(__path_schemas + 'setting');
const ArticleModel 	= require(__path_schemas + 'article');
const CategoryModel 	= require(__path_schemas + 'category');

/* GET home page. */
router.get('/',async  function(req, res, next) {
  let setting = {};
  let category = [];
  await SettingModel.find({}).then((rs)=>{
    rs = JSON.parse(JSON.stringify(rs));
    setting = rs[0]
    
  });
  await CategoryModel.find({status:'active'}).then((rs)=>{
    category = rs;
  })
 ArticleModel.find({}).then((article)=>{
    res.render(`${folderView}singlePage`, { pageTitle   : 'singlePage ',layout: __path_views_front +'front' ,
    linkIndex,setting,article,category});
  
 })
 
});
module.exports = router;
