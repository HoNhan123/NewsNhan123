var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const GroupsModel 	= require(__path_schemas + 'groups');
const ValidateGroups	= require(__path_validates + 'groups');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/groups/';
const pageTitleIndex = 'Groups Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_back + 'pages/groups/';

// List groups
router.get('(/status/:status)?', async (req, res, next) => {
	let objwhere = {};
	let params 		 = {};
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	params.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	params.sortField  	 = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
	params.sortType 	 = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');

	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};


	let sort		= {};
	if(params.currentStatus !== 'all') objwhere.status = params.currentStatus;
	if(params.keyword !== '') objwhere.name = new RegExp(params.keyword, 'i');
	
	sort[params.sortField]  = params.sortType;
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'groups');
	await GroupsModel.count(objwhere).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	GroupsModel
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
	
	GroupsModel.updateOne({_id: id}, {status: status}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change ordering 
router.get('/change-ordering/:id/:ordering', (req, res, next) => {
	let newOrdering	= ParamsHelpers.getParam(req.params, 'ordering', ''); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	
	GroupsModel.updateOne({_id: id}, {ordering: newOrdering}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	GroupsModel.updateMany({_id: {$in: req.body.cid }}, {status: currentStatus}, (err, result) => {
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
			GroupsModel.updateOne({_id: item}, {ordering: parseInt(orderings[index])}, (err, result) => {});
		})
	}else{ 
		GroupsModel.updateOne({_id: cids}, {ordering: parseInt(orderings)}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	GroupsModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	GroupsModel.remove({_id: {$in: req.body.cid }}, (err, result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});

// FORM
router.get(('/form(/:id)?'), (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue'};
	let errors   = null;
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors});
	}else { // EDIT
		GroupsModel.findById(id, (err, item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateGroups.validator(req);

	let item = Object.assign(req.body);
	let errors = req.validationErrors();

	if(typeof item !== "undefined" && item.id !== "" ){	// edit
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		}else {
			GroupsModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
				status: item.status,
				content: item.content,
				group_acp: item.group_acp
			}, (err, result) => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			});
		}
	}else { // add
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors});
		}else {
			new GroupsModel(item).save().then(()=> {
				req.flash('success', notify.ADD_SUCCESS, false);
				res.redirect(linkIndex);
			})
		}
	}	
});

//sort
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
	req.session.sort_field		= ParamsHelpers.getParam(req.params, 'sort_field', 'ordering');
	req.session.sort_type		= ParamsHelpers.getParam(req.params, 'sort_type', 'asc');
	res.redirect(linkIndex);
});

// Change Group ACP
router.get('/change-group-acp/:id/:group_acp', (req, res, next) => {
	let currentGroupACP	= ParamsHelpers.getParam(req.params, 'group_acp', 'yes'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	let group_acp			= (currentGroupACP === "yes") ? "no" : "yes";
	
	GroupsModel.updateOne({_id: id}, {group_acp: group_acp}, (err, result) => {
		req.flash('success', notify.CHANGE_GROUP_ACP_SUCCESS, false);
		res.redirect(linkIndex);
	});
});


module.exports = router;
