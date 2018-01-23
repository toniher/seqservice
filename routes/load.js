var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

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
	
		// Remove BOM if it exists;
		data = data.replace('\ufeff', '');
		
		var dataObj = JSON.parse( data );
		var digest = hash.digest( dataObj );
		
		var newObj = {};
		newObj._id = digest;
		newObj.meta = config.meta; // Adding meta information
		
		// Analyse obj TODO: Here all the work with loading
		if ( dataObj.type && dataObj.type === "blast" ) {
			if ( dataObj.data ) {
					newObj.type = "blast";
					newObj.data = dataObj.data;
					newObj.oldid = dataObj._id; //Old ID. For sake of tracking
			}
		} else {
		
			if ( dataObj.BlastOutput2 ) {
				newObj.type = "blast";
				newObj.data = dataObj;
			}
	
		}
		
		newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
		functions.returnJSON( res, JSON.stringify( newObj ) );
	});
	

};
