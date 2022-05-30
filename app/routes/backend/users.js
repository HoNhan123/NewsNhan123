var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const UsersModel 	= require(__path_schemas + 'users');
const GroupsModel 	= require(__path_schemas + 'groups');
const ValidateUsers	= require(__path_validates + 'users');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const FileHelpers = require(__path_helpers + 'file');
const uploadFolder = 'public/uploads/users/';

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/users/';
const pageTitleIndex = 'Users Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_back + 'pages/users/';
const uploadAvatar	 = FileHelpers.upload('avatar', 'users');

// List users
router.get('(/status/:status)?', async (req, res, next) => {
	let objwhere = {};
	let params 		 = {};
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	params.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	params.sortField  	 = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
	params.sortType 	 = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');

	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 3,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};


	let sort		= {};
	if(params.currentStatus !== 'all') objwhere.status = params.currentStatus;
	if(params.keyword !== '') objwhere.name = new RegExp(params.keyword, 'i');
	
	sort[params.sortField]  = params.sortType;
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'items');
	await UsersModel.count(objwhere).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	UsersModel
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
				linkIndex
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	let status			= (currentStatus === "active") ? "inactive" : "active";
	
	UsersModel.updateOne({_id: id}, {status: status}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change ordering 
router.get('/change-ordering/:id/:ordering', (req, res, next) => {
	let newOrdering	= ParamsHelpers.getParam(req.params, 'ordering', ''); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	
	UsersModel.updateOne({_id: id}, {ordering: newOrdering}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	UsersModel.updateMany({_id: {$in: req.body.cid }}, {status: currentStatus}, (err, result) => {
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
			UsersModel.updateOne({_id: item}, {ordering: parseInt(orderings[index])}, (err, result) => {});
		})
	}else{ 
		UsersModel.updateOne({_id: cids}, {ordering: parseInt(orderings)}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	await UsersModel.findById(id).then((item) => {
		FileHelpers.remove(uploadFolder, item.avatar);
	});
	UsersModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete',async (req, res, next) => {
	if(Array.isArray(id)){
		for(let index = 0; index < id.length; index++){
			await UsersModel.findById(id[index]).then((item) => {
				FileHelpers.remove(uploadFolder, item.avatar);
			}); 
		}
	}else{
		await UsersModel.findById(id).then((item) => {
			FileHelpers.remove(uploadFolder, item.avatar);
		});
	}

	UsersModel.remove({_id: {$in: req.body.cid }}, (err, result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});

// FORM
router.get(('/form(/:id)?'),async (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue', group_id: '', group_name: ''};
	let errors   = null;
	let groupsItems	= [];
	await GroupsModel.find({}, {_id: 1, name: 1}).then((rs)=>{
		groupsItems = rs;
		groupsItems.unshift({_id: 'allvalue', name: 'All group'});
	})
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors,groupsItems});
	}else { // EDIT
		UsersModel.findById(id, (err, item) =>{
			item.group_id = item.group.id;
			item.group_name = item.group.name;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors,groupsItems});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	uploadAvatar(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));

	let item = Object.assign(req.body);
	let taskCurrent	= (typeof item !== "undefined" && item.id !== "" ) ? "edit" : "add";
	let errors = ValidateUsers.validator(req, errUpload, taskCurrent);
	console.log(item)

		if(errors) { 
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			if(req.file != undefined) FileHelpers.remove('public/uploads/users/', req.file.filename); // xóa tấm hình khi form khong hop le
			
			let groupsItems	= [];
			await GroupsModel.find({}, {_id: 1, name: 1}).then((items)=> {
				groupsItems = items;
				groupsItems.unshift({_id: 'allvalue', name: 'All group'});
			});
			
			if (taskCurrent == "edit") item.avatar = item.image_old;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		}else {
			let message = (taskCurrent == "add") ? notify.EDIT_SUCCESS : notify.EDIT_SUCCESS;
			if(req.file == undefined){ // không có upload lại hình
				item.avatar = item.image_old;
			}else{
				item.avatar = req.file.filename;
				if(taskCurrent == "edit") FileHelpers.remove('public/uploads/users/', item.image_old);
			}
			if(taskCurrent == "add") {
				item.created = {
					user_id : 0,
					user_name: "admin",
					time: Date.now()
				}
				item.group = {
					id: item.group_id,
					name: item.group_name,
				}
				return new UsersModel(item).save().then((result) => {
					req.flash('success', message, false);
					res.redirect(linkIndex);
				});
			}
	
			if(taskCurrent == "edit") {
				return UsersModel.updateOne({_id: item.id}, {
					ordering: parseInt(item.ordering),
					name: item.name,
					status: item.status,
					content: item.content,
					avatar: item.avatar,
					group: {
						id: item.group_id,
						name: item.group_name,
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
	
			if(taskCurrent == "change-group-name") {
				return UsersModel.updateMany({'group.id': item.id}, {
					group: {
						id: item.id,
						name: item.name,
					},
				}).then((result) => {
					req.flash('success', message, false);
					res.redirect(linkIndex);
				});
			}

			// UsersModel.updateOne({_id: item.id}, {
			// 	ordering: parseInt(item.ordering),
			// 	name: item.name,
			// 	status: item.status,
			// 	content: item.content
			// }, (err, result) => {
			// 	req.flash('success', notify.EDIT_SUCCESS, false);
			// 	res.redirect(linkIndex);
			// });
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
