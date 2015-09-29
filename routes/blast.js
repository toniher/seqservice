var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var $p = require('procstreams');
var fasta = require('biojs-io-fasta');

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

	var socketio = config.socketio; // Wheter to use this socketio or not;

	console.log("DB: "+db+ " -- "+config.db.list);
	var DBcontainer = functions.getPath( db, config.db.list ); // Get path from array
	var DBpath = DBcontainer.path;
	var seq = req.body.seq;

	// TODO: Further processing of seq here (whether FASTA or simple text)

	// TODO: CHECK IF SEQUENCE is NUCLEIC ACID

	var program = config.exec.path + "/" + binary;
	var io = req.app.set('io');

	//console.log( seq + "-" + program + "-" + DBpath + "-" );
			
	run_cmd( [seq, program, DBpath, opts], function(err, output) {
		
		var object = {};

		if ( ( output.match(/BlastOutput2/g)||[]).length > 1 ) {
			output = processMultiOutput( output );
			object = JSON.parse(output);
			object = addMultiSeqs( object, seq );
		} else {
			object = JSON.parse(output);
			object.seq = seq;
		}

		functions.returnSocketIO( socketio, io, "blast", res, JSON.stringify( object ) ); 
	
	});
}

function run_cmd ( args, callBack ) {

	var resp = "";
	
	// Elements to pipe
	var textfile = [ processTextInput( args[0] ) ].join("\n");

	var blastprog = args[1] + " -db " + args[2] + " -outfmt 13 " + args[3];

	// We pass thru STDOUT, we avoid temp file
	// Handled by procstreams
	$p("echo \"" + textfile + "\"" ).pipe( blastprog )
	.data(function(err, stdout, stderr) {
		if ( err ) {
			callBack( err, stderr.toString() );
		} else {
			if ( stdout ) {
				resp += stdout.toString();
			}
			callBack( null, resp );
		}
	
	});

}

function processTextInput( text ) {

	text = text.trim();

	if ( ! text.startsWith( ">" ) ) {
		text = ">ENTRY" + text;
	}

	return text;
}

function processMultiOutput( output ) {

	output = output.replace( /\s*\{\s*\"BlastOutput2\"/g, ", { \"BlastOutput2\"" );

	output = output.trim();

	output = output.replace( /^\s*\,\s*\{/, "{" );
	output = "[" + output + "]";

	return output;
}

function addMultiSeqs( object, seqs ) {

	var listSeqs = fasta.parse( seqs );

	for ( var f = 0; f < object.length; f = f + 1 ) {

		if ( listSeqs[f] ) {

			if ( listSeqs[f].hasOwnProperty("seq") ) {
				object[f].seq = listSeqs[f].seq;
			}
			if ( listSeqs[f].hasOwnProperty("id") ) {
				object[f].id = listSeqs[f].id;
			}
			if ( listSeqs[f].hasOwnProperty("name") ) {
				object[f].name = listSeqs[f].name;
			}

		}
	}

	return object;
}


if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	};
}



