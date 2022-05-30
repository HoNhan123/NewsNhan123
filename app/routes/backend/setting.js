var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const SettingModel 	= require(__path_schemas + 'setting');
const ValidateItems	= require(__path_validates + 'items');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const FileHelpers = require(__path_helpers + 'file');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/setting/';
const pageTitleIndex = 'Setting Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_back + 'pages/setting/';
const uploadLogo	 = FileHelpers.upload('logo', 'setting');
const ValidateSetting	= require(__path_validates + 'setting');


// List items
router.get('/', (req,res,next)=>{
   SettingModel.find({}).then((setting)=>{
    res.render(`${folderView}list`,
    {setting:setting[0],
            pageTitle: pageTitleIndex,
            linkIndex
    })
   })
   
});

router.post('/save',  (req,res,next)=>{
        uploadLogo(req, res, async (errUpload) => {
                let errors = ValidateSetting.validator(req, errUpload);
                req.body = JSON.parse(JSON.stringify(req.body))
        
		if(errors) { 

			if(req.file != undefined) FileHelpers.remove('public/uploads/setting/', req.file.filename); // xóa tấm hình khi form khong hop le

			res.redirect(linkIndex);
		}else {
                        let data = Object.assign(req.body);
                        if(req.file == undefined){
                                data.logo = data.logo_old;
                        }else{
				data.logo = req.file.filename;
				FileHelpers.remove('public/uploads/setting/', data.logo_old);
			}
                             
                        await SettingModel.updateOne({_id: data.id}, {
                                mail: data.mail,
                                facebook: data.facebook,
                                phone: data.phone,
                                twitter: data.twitter,
                                youtube: data.youtube,
                                linkedin: data.linkedin,
                                instagram: data.instagram,
                                logo:data.logo,
                                cate_per_row: data.cate_per_row
                                
                        },(err,rs)=>{
                                res.redirect(linkIndex)
                        });
		};
        })  
})

module.exports = router;
