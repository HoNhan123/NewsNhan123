const SettingModel 	= require(__path_schemas + 'setting');
const FileHelpers = require(__path_helpers + 'file');
const uploadFolder = 'public/uploads/article/';

module.exports = {
    getTopBar: ()=>{
       return  SettingModel.find({}).then((rs)=>{
             rs = JSON.parse(JSON.stringify(rs));
             
         })
    },
}