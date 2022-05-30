var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const ArticleModel 	= require(__path_schemas + 'article');
const CategoryModel 	= require(__path_schemas + 'category');
const ValidateArticle	= require(__path_validates + 'article');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const FileHelpers = require(__path_helpers + 'file');
const uploadFolder = 'public/uploads/article/';
const StringHelpers 	= require(__path_helpers + 'string');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/article/';
const pageTitleIndex = 'Article Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_back + 'pages/article/';
const uploadAvatar	 = FileHelpers.upload('avatar', 'article');

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let objwhere = {};
	let params 		 = {};
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	params.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	params.sortField  	 = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
	params.sortType 	 = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');

	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 500,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	
	let sort		= {};
	if(params.currentStatus !== 'all') objwhere.status = params.currentStatus;
	if(params.keyword !== '') objwhere.name = new RegExp(params.keyword, 'i');
	
	sort[params.sortField]  = params.sortType;
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'items');
	await ArticleModel.count(objwhere).then( (data) => {
		params.pagination.totalItems = data;
	});
	let CategoryItems	= [];
	await CategoryModel.find({}, {_id: 1, name: 1}).then((rs)=>{
		CategoryItems = rs;
		CategoryItems.unshift({_id: 'allvalue', name: 'All group'});
		CategoryItems = JSON.parse(JSON.stringify(CategoryItems))
	});
	ArticleModel
		.find(objwhere)
		.sort(sort)
		.skip((params.pagination.currentPage - 1) * params.pagination.totalItemsPerPage)
		.limit(params.pagination.totalItemsPerPage)
		.then((items) => {
			res.render(`${folderView}list`, {
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				params,
				linkIndex,
				CategoryItems
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	let status			= (currentStatus === "active") ? "inactive" : "active";
	
	ArticleModel.updateOne({_id: id}, {status: status}, (err, result) => {
		res.send({status})
	});
});

// Change ordering
router.get('/change-ordering/:id/:ordering', (req, res, next) => {
	let newOrdering	= ParamsHelpers.getParam(req.params, 'ordering', ''); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	
	ArticleModel.updateOne({_id: id}, {ordering: newOrdering}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change category selected box
router.post('/change-category/', (req, res, next) => {
	let data = req.body;	
	ArticleModel.updateOne({_id: data.idArtical}, {category: {id:data.idCategory, name:data.textCategory}}, (err, result) => {
		res.send({result:'OK'});
	});
});


// FORM
router.get(('/form(/:id)?'),async (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {	
					id:id,
					name: '', 
					ordering: 0, 
					status: 'novalue', 
					category_id: '', 
					category_name: '',
					avatar:'',
					content:'',
					slug:''
				};
	let errors   = null;
	let CategoryItems	= [];
	await CategoryModel.find({}, {_id: 1, name: 1}).then((rs)=>{
		CategoryItems = rs;
		CategoryItems.unshift({_id: 'allvalue', name: 'All group'});
		CategoryItems = JSON.parse(JSON.stringify(CategoryItems));
	})
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors,CategoryItems,linkIndex });
	}else { // EDIT
		ArticleModel.findById(id,async (err, artical) =>{
			item.category_id = artical.category.id;
			item.category_name = await CategoryModel.findById(artical.category.id).then((rs)=>{return rs.name});
			item.name = artical.name;
			item.ordering = artical.ordering;
			item.status = artical.status;
			item.avatar = artical.avatar;
			item.content = artical.content;
			item.slug = artical.slug;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors,CategoryItems,linkIndex });
		});	
	}
});
// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	ArticleModel.updateMany({_id: {$in: req.body.cid }}, {status: currentStatus}, (err, result) => {
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.n) , false);
		res.redirect(linkIndex);
	});
});

// Change ordering - Multi
router.post('/change-ordering', (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;
	
	if(Array.isArray(cids)) {
		cids.forEach((item, index) => {
			ArticleModel.updateOne({_id: item}, {ordering: parseInt(orderings[index])}, (err, result) => {});
		})
	}else{ 
		ArticleModel.updateOne({_id: cids}, {ordering: parseInt(orderings)}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	await ArticleModel.findById(id).then((item) => {
		FileHelpers.remove(uploadFolder, item.avatar);
	});
	ArticleModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete',async (req, res, next) => {
	if(Array.isArray(id)){
		for(let index = 0; index < id.length; index++){
			await ArticleModel.findById(id[index]).then((item) => {
				FileHelpers.remove(uploadFolder, item.avatar);
			}); 
		}
	}else{
		await ArticleModel.findById(id).then((item) => {
			FileHelpers.remove(uploadFolder, item.avatar);
		});
	}

	ArticleModel.remove({_id: {$in: req.body.cid }}, (err, result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});


// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	uploadAvatar(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));

		let item = Object.assign(req.body); console.log(item);
	let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";
	let errors = ValidateArticle.validator(req, errUpload, taskCurrent);

		if(errors) { 
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			if(req.file != undefined) FileHelpers.remove('public/uploads/article/', req.file.filename); // xóa tấm hình khi form khong hop le
			
			// let CategoryItems	= [];
			// await CategoryModel.find({}, {_id: 1, name: 1}).then((items)=> {
			// 	CategoryItems = items;
			// 	CategoryItems.unshift({_id: 'allvalue', name: 'All group'});
			// });
			
			if (taskCurrent == "edit") item.avatar = item.image_old;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		}else {
			
			let message = (taskCurrent == "add") ? notify.ADD_SUCCESS : notify.EDIT_SUCCESS;
			if(req.file == undefined){ // không có upload lại hình
				item.avatar = item.image_old;
			}else{
				item.avatar = req.file.filename;
				if(taskCurrent == "edit") FileHelpers.remove('public/uploads/article/', item.image_old);
			}
			if(taskCurrent == "add") {
				
				item.created = {
					user_id : 0,
					user_name: "admin",
					time: Date.now()
				}
				item.category = {
					id: item.category_id,
					name: item.category_name,
				}
				return new ArticleModel(item).save().then((result) => {
					req.flash('success', message, false);
					res.redirect(linkIndex);
				});
			}
	
			if(taskCurrent == "edit") {
				return ArticleModel.updateOne({_id: item.id}, {
					ordering: item.ordering,
					name: item.name,
					status: item.status,
					content: item.content,
					avatar: item.avatar,
					slug: StringHelpers.createAlias(item.slug),
					category: {
						id: item.category_id,
						name: item.category_name,
					},
					modified: {
						user_id : 0,
						user_name: 0,
						time: Date.now()
					}
				}).then((result) => {
					req.flash('success', message, false);
					res.redirect(linkIndex);
				});
			}
	
			// if(taskCurrent == "change-group-name") {
			// 	return ArticleModel.updateMany({'group.id': item.id}, {
			// 		group: {
			// 			id: item.id,
			// 			name: item.name,
			// 		},
			// 	}).then((result) => {
			// 		req.flash('success', message, false);
			// 		res.redirect(linkIndex);
			// 	});
			// }

		 };
	});
	
});

//sort
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
	req.session.sort_field		= ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
	req.session.sort_type		= ParamsHelpers.getParam(req.params, 'sort_type', 'asc');
	res.redirect(linkIndex);
});

module.exports = router;
