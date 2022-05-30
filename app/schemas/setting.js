const mongoose = require('mongoose');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({ 
    mail:String,
    phone:String,
    twitter:String,
    facebook:String,
    linkedin:String,
    instagram:String,
    youtube:String,
    logo:String,
    logo_old:String,
    cate_per_row:Number
    
});

module.exports = mongoose.model(databaseConfig.col_setting, schema );