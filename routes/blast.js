var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

// We should include other Blast Programs here
exports.performBlast = function (req, res) {

	var config;
	config = req.app.set('config');

	var db = config.db.def;
	if (req.body.db) {
		db = req.body.db;
	}
	var DBcontainer = functions.getPath( db, config.db.list ); // Get path from array

	var blastparams = {};
	blastparams.taxon = req.body.organism;
	blastparams.db = DBcontainer.path; // Get path
	blastparams.exe = config.exec.blastdbcmd;

	var organism = parseInt( req.body.organism, 10 );

	if ( organism && ( organism !== 0 || organism === 'NaN' ) ) {

//		mysqlqueries.getListID( organism, function( listID ) {

//			if ( listID.length > 0 ) {
//				temp.track();

//				// Process the data (note: error handling omitted)
//				temp.open('tmp', function(err, info) {
//					if (!err) {
//						fs.write(info.fd, listID.join("\n"));
//						fs.close(info.fd, function(err) {
//							run_blast( blastparams, req, res, info.path );
//						});
//					}
//				});

//			} else {
//				
//				// TODO: Here return no value;
//				run_blast( blastparams, req, res );
//			}
//		});
		
		// TODO: Here we should allow filtering by taxon ID
		run_blast( blastparams, req, res );
		
	} else {
		run_blast( blastparams, req, res );
	}

};

function run_blast( params, req, res, seqidpath ){

	var config, opts, db, fullpath;
	config = req.app.set('config');

	opts = "";
	
	var binary = "blastn";
	if (req.body.binary) {
		binary = req.body.binary;
	}

	db = config.db.def;
	if (req.body.db) {
		db = req.body.db;
	}

	if (req.body.evalue) {
		opts = opts + " -evalue " + req.body.evalue;
	}

	if ( seqidpath ) {
		opts = opts + " -seqidlist " + seqidpath;
	}

	console.log("DB: "+db+ " -- "+config.db.list);
	var DBcontainer = functions.getPath( db, config.db.list ); // Get path from array
	var DBpath = DBcontainer.path;
	var seq = req.body.seq;

	var format = req.body.format; // Format to return, default JSON or JSONP

	// TODO: CHECK IF SEQUENCE is NUCLEIC ACID

	var program = config.exec.path + "/" + binary;
	var xsl_blast = config.xsl[binary];
	var io = req.app.set('io');

	console.log( seq + "-" + program + "-" + DBpath + "-" + xsl_blast );
	
	// TODO: Check if we can get rid of wrapper. Idea: https://github.com/polotek/procstreams
	run_cmd( config.wrapper, [seq, program, DBpath, xsl_blast, opts], function (object) {
		io.emit("output", functions.printBlastHTML( object ) );
		console.log(object);
	
		if ( format && format === 'html' ) {
			functions.printBlastHTML( object, res );
		} else {
			// If configured JSONP
			if ( res.app.set('config').jsonp ) {
				res.jsonp( object );
			} else {
				res.set( 'Content-Type', 'application/json' );
				res.send( object );
			}
		}
	
	});
}

function run_cmd ( cmd, args, callBack ) {
	var spawn = require('child_process').spawn;
	var child = spawn(cmd, args);
	var resp = "";
	child.stderr.on('data', function (err) { console.log("ERR: " + err.toString()); });
	child.stdout.on('data', function (buffer) { resp += buffer.toString(); });
	child.stdout.on('end', function () { callBack(resp); });
}

