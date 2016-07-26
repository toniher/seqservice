var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');
	

exports.getTemp = function(req, res) {

	var config = req.app.set('config');
	
	var directory = false;
	var compress = false;
	var path = false;
	var contenttype = "text/x-fasta";
	var filename = "down.fasta";
	
	var stdout = "";

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


	var contentdisposition = "attachment; filename=" + filename;


	res.set( 'Content-Type', contenttype );
	res.set( 'Content-Disposition', contentdisposition );

	res.send( stdout );


};