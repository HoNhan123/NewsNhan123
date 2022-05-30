var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const CategoryModel 	= require(__path_schemas + 'category');
const ValidateCategory	= require(__path_validates + 'category');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const StringHelpers 	= require(__path_helpers + 'string');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/category/';
const pageTitleIndex = 'Category Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_back + 'pages/category/';

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
		totalItemsPerPage: 5,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};


	let sort		= {};
	if(params.currentStatus !== 'all') objwhere.status = params.currentStatus;
	if(params.keyword !== '') objwhere.name = new RegExp(params.keyword, 'i');
	
	sort[params.sortField]  = params.sortType;
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'category');
	await CategoryModel.count(objwhere).then( (data) => {
		params.pagination.totalItems = data;
	});
	
	CategoryModel
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
	
	CategoryModel.updateOne({_id: id}, {status: status}, (err, result) => {
		res.send({status})
	});
});

// Change ordering 
router.get('/change-ordering/:id/:ordering', (req, res, next) => {
	let newOrdering	= ParamsHelpers.getParam(req.params, 'ordering', ''); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	
	CategoryModel.updateOne({_id: id}, {ordering: newOrdering}, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	CategoryModel.updateMany({_id: {$in: req.body.cid }}, {status: currentStatus}, (err, result) => {
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
			CategoryModel.updateOne({_id: item}, {ordering: parseInt(orderings[index])}, (err, result) => {});
		})
	}else{ 
		CategoryModel.updateOne({_id: cids}, {ordering: parseInt(orderings)}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	CategoryModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	CategoryModel.remove({_id: {$in: req.body.cid }}, (err, result) => {
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
		CategoryModel.findById(id, (err, item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateCategory.validator(req);

	let item = Object.assign(req.body);
	let errors = req.validationErrors();

	if(typeof item !== "undefined" && item.id !== "" ){	// edit
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		}else {
			CategoryModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
				status: item.status,
				slug: StringHelpers.createAlias(item.slug),
			}, (err, result) => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			});
		}
	}else { // add
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors});
		}else {
			item.slug = StringHelpers.createAlias(item.slug);
			new CategoryModel(item).save().then(()=> {
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

module.exports = router;
