var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

// Retrieve a File
exports.getFile = function (req, res) {

	var config;
	config = req.app.set('config');

	var out = {};
	out.file = req.file;

	fs.readFile( out.file.path , 'utf8', function (err,data) {
	  if (err) {
		out.err = err;
		functions.returnJSON( res, out );
	  }
	  functions.returnJSON( res, data );
	});

	
};