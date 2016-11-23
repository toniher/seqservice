var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

require('babel-polyfill');
var hash = require('json-hash');
var moment = require('moment');

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

	  var dataObj = JSON.parse( data );
	  var digest = hash.digest( dataObj );
	  var newObj = {};
	  newObj._id = digest;
	  newObj.type = "blast";
	  newObj.data = dataObj;
  
	  newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
	  functions.returnJSON( res, JSON.stringify( newObj ) );
	});

	
};
