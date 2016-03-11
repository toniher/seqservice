var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

// Retrieve a File
exports.getFile = function (req, res) {

	var config;
	config = req.app.set('config');

	var out = {};
	out.file = req.file;

	functions.returnJSON( res, out );
};