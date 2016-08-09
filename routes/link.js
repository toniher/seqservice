var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

exports.getLinks = function(req, res) {

	var config = req.app.set('config');

	var outcome = {};

	var db = null;
	if ( req.params.db ) {
		db = req.params.db;
	}

	var dbtype = null;

	if ( req.params.dbtype ) {
		dbtype = req.params.dbtype;
	}

	if ( db && dbtype ) {
		if ( config['db']['list'] ) {

			var list = config['db']['list'];
			if ( list[ dbtype ] && list[ dbtype ][ db ] && list[ dbtype ][ db ]["links"] ) {
				outcome = list[ dbtype ][ db ]["links"];
			}

		}
	} 
	
	functions.returnJSON( res, outcome );

};



