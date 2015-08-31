var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var $p = require('procstreams');

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

	// TODO: Further processing of seq here (whether FASTA or simple text)

	var format = req.body.format; // Format to return, default JSON or JSONP

	// TODO: CHECK IF SEQUENCE is NUCLEIC ACID

	var program = config.exec.path + "/" + binary;
	var io = req.app.set('io');

	console.log( seq + "-" + program + "-" + DBpath + "-" );
			
	run_cmd( [seq, program, DBpath, opts], function(err, object) {
		
		// TODO: Handle errors

		console.log( object );
		// TODO: add seq to object

		if ( format && format === 'html' ) {
			io.emit("blast", object );
			res.send({});
		} else {
			//// If configured JSONP
			if ( res.app.set('config').jsonp ) {
				res.jsonp( object );
			} else {
				res.set( 'Content-Type', 'application/json' );
				res.send( object );
			}
		}
	
	});
}

function run_cmd ( args, callBack ) {

	var resp = "";
	
	// Elements to pipe
	var textfile = [ ">ENTRY", args[0] ].join("\n");
	var blastprog = args[1] + " -db " + args[2] + " -outfmt 13 " + args[3];

	// We pass thru STDOUT, we avoid temp file
	// Handled by procstreams
	$p("echo \"" + textfile + "\"" ).pipe( blastprog )
	.data(function(err, stdout, stderr) {
		if ( err ) {
			callBack( err, stderr.toString() );
		} else {
			// console.log("OUT");
			resp += stdout.toString();
			callBack( null, resp );
		}
	
	});

}


