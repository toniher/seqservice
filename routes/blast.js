var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

require('babel-polyfill');
var hash = require('json-hash');
var moment = require('moment');

var spawn = require('child_process').spawn;

// var $p = require('procstreams');
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

	blastparams.psicheck = req.body.psicheck;
	blastparams.psiiter = req.body.psiiter;

	
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
	
	// TODO. Better handling params
	var blast_params = {};
	
	var binary = "blastn";
	var dbtype = "nucl";
	
	if (req.body.binary) {
		binary = req.body.binary;
	}
	
	if (req.body.dbtype) {
		dbtype = req.body.dbtype;
	}

	db = config.db.def;
	if (req.body.db) {
		db = req.body.db;
	}

	if ( params.psicheck && binary == "blastp" ) {
		binary = "psiblast";
		
		if ( params.psiiter && ( params.psiiter == ( parseInt( params.psiiter, 10 ) ) ) ) {
			blast_params.psiiter = params.psiiter;
		}
	}

	if (req.body.evalue) {
		blast_params.evalue = req.body.evalue;
	}

	if ( seqidpath ) {
		blast_params.seqidlist = seqidpath;
	}

	blast_params.outfmt = 15;
	
	var socketio = config.socketio; // Wheter to use this socketio or not;

	var DBcontainer = functions.getPath( db, config.db.list ); // Get path from array
	var DBpath = DBcontainer.path;
	var seq = req.body.seq;


	// TODO: CHECK IF SEQUENCE is NUCLEIC ACID

	var program = config.exec.path + "/" + binary;
	var io = req.app.set('io');

	//console.log( seq + "-" + program + "-" + DBpath + "-" );

	var execparams = Object.assign({}, blast_params);
	
	blast_params.db = db;
	blast_params.binary = binary;
	blast_params.dbtype = dbtype;

	execparams.db = DBpath;
	
	strParams = joinParams( execparams, "-" );

	var child = spawn( 'node', [ './pipe.js', [ processTextInput( seq ) ].join("\n"), JSON.stringify( [{ "app": program, "params": strParams }] ) ] );

	// Listen for stdout data
	child.stderr.on('data', function (data) {
                if (typeof data !== 'string' || !( data  instanceof String) ) {
                        data = data.toString();
                }	
		console.error("ERR: " + data );
	});
	
	var output = "";

	// Listen for stdout data
	child.stdout.on('data', function ( data ) {
				
		if (typeof data !== 'string' || !( data  instanceof String) ) {
			data = data.toString();
		}
		
		output += data;
	});
	
	child.on('close', function ( code ) {

		var object = {};
		
		if ( ( output.match(/report/g)||[]).length > 1 ) {
			// output = processMultiOutput( output ); TODO: Temporary outp
			object = JSON.parse(output);
			object = addMultiSeqs( object, seq );
		} else {
			object = JSON.parse(output);
			if ( ! seq.startsWith( ">" ) ) {
				object.seq = seq;
			} else {
				object = addUniSeq( object, seq );
			}
		}
		
		object.params = blast_params;
		
		var digest = hash.digest( object );
		var newObj = {};
		newObj._id = digest;
		newObj.type = "blast";
		newObj.data = object;
		newObj.timestamp = moment().format('YYYYMMDDHHmmSS');
		
		functions.returnSocketIO( socketio, io, "blast", res, JSON.stringify( newObj ) ); 
	
	});
}

function processTextInput( text ) {

	text = text.trim();

	if ( ! text.startsWith( ">" ) ) {
		text = ">ENTRY\n" + text;
	}

	return text;
}

function processMultiOutput( output ) {

	//output = output.replace( /\s*\{\s*\"BlastOutput2\"/g, ", { \"BlastOutput2\"" );
	//
	//output = output.trim();
	//
	//output = output.replace( /^\s*\,\s*\{/, "{" );
	//output = "[" + output + "]";

	return output;
}

function addMultiSeqs( object, seqs ) {

	var listSeqs = fasta.parse( seqs );

	if ( object.hasOwnProperty("BlastOutput2") ) {

		var outputReports = object["BlastOutput2"];
		
		if ( outputReports instanceof Array ) { //If array
			
			for ( var f = 0; f < outputReports.length; f = f + 1 ) {
		
				if ( listSeqs[f] ) {
		
					if ( listSeqs[f].hasOwnProperty("seq") ) {
						object["BlastOutput2"][f].seq = listSeqs[f].seq;
					}
					if ( listSeqs[f].hasOwnProperty("id") ) {
						object["BlastOutput2"][f].id = listSeqs[f].id;
					}

					object["BlastOutput2"][f] = assignSeqName( listSeqs[f], object["BlastOutput2"][f] );
		
				}
			}
			
		}
		
	}
	
	return object;
}

// TODO: Merge with Multiseqs
function addUniSeq( object, seq ) {

	var oneSeq = fasta.parse( seq );

	if ( oneSeq.length > 0 ) {
	
		if ( oneSeq[0].hasOwnProperty("seq") ) {
			object.seq = oneSeq[0].seq;
		}
		if ( oneSeq[0].hasOwnProperty("id") ) {
			object.id = oneSeq[0].id;
		}

		object = assignSeqName( oneSeq[0], object );

	}

	return object;
}

function assignSeqName( seqContainer, object ) {

	if ( seqContainer.hasOwnProperty("name")  ) {
		if ( seqContainer.name !== "" ) { 
			object.name = seqContainer.name;
		} else {
			if ( seqContainer.hasOwnProperty("ids") ) {
				var nameArr = [];
				for ( var k in  Object.keys( seqContainer.ids ) ) {
					if ( typeof seqContainer.ids[k] !== 'undefined' ) {
						nameArr.push( k + "|" + seqContainer.ids[k] );
					}
				}
				if ( nameArr.length === 0 ) {
					if ( seqContainer.hasOwnProperty("id") ) {
						object.name = "Seq" + String( seqContainer.hasOwnProperty("id") );
					} else {
						object.name = "Seq";
					}
				} else {
					object.name = "|".join( nameArr );
				}
			} else {
				if ( seqContainer.hasOwnProperty("id") ) {
					object[.name = "Seq" + String( seqContainer.hasOwnProperty("id") );
				} else {
					object.name = "Seq";
				}
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


function joinParams( params, sep ) {

	var arr = [];
	
	if ( ! sep ) {
			sep = "--";
	}
	
	for ( var param in params ) {

		if ( params.hasOwnProperty( param ) ) {
			arr.push( sep + param + " " + params[ param ] );
		}
	}
	
	return arr.join( " " );
	
}



