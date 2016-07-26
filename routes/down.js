var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');
	

exports.checkExists = function( req, res ) {
	
	var config = req.app.set('config');
	
	var path = false;
	
	if ( req.body.path ) {
		path = req.body.path;
	}
	
	var outcome = {};
	outcome.exists = false;
	
	var filepath = os.tmpdir() + path;
	
	fs.exists(filepath, function(exists) {
	    if (exists) {
			outcome.exists = true;
			functions.returnJSON( res, outcome );
		} else {
			functions.returnJSON( res, outcome );
		}
	});	
	
};

exports.getTemp = function(req, res) {

	var config = req.app.set('config');
	
	var directory = false;
	var compress = false;
	var path = false;
	var contenttype = "text/x-fasta";
	var filename = "down.fasta";
	
	if ( req.body.directory ) {
		directory = req.body.directory;
	}

	if ( req.body.compress ) {
		compress = req.body.compress;
	}
	
	if ( req.body.path ) {
		path = req.body.path;
	}
	
	if ( req.body.contenttype ) {
		contenttype = req.body.contenttype;
	}

	if ( req.body.filename ) {
		filename = req.body.filename;
	}

	// var contentdisposition = "attachment; filename=" + filename;

	res.set( 'Content-Type', contenttype );
	
	var filepath = os.tmpdir() + path;
	
	
	fs.exists(filepath, function(exists) {
	    if (exists) {
			// Do something
			res.download( filepath, filename, function(err){
				if (err) {
				  // Handle error, but keep in mind the response may be partially-sent
				  // so check res.headersSent
				  console.err("Some error!");
				}
			});
	    }
	});
	

	//res.set( 'Content-Disposition', contentdisposition );

	// res.send( stdout );


};