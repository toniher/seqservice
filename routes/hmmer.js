var functions = require('../functions/index.js');
var temp = require('temp').track(),
    fs   = require('fs');

require('babel-polyfill');
var hash = require('json-hash');
var moment = require('moment');

var spawn = require('child_process').spawn;

// var $p = require('procstreams');
var fasta = require('biojs-io-fasta');

var hmmer3process = {};

// We should include other Blast Programs here
exports.performHmmer = function (req, res) {

	var config;
	config = req.app.set('config');

	var db = config.db.def;
	if ( req.body.db ) {
		db = req.body.db;
	}
	
	// TODO: Handle types here
	var hmmerparams = {};
	hmmerparams.binary = req.body.binary;
	hmmerparams.taxon = req.body.organism;
	hmmerparams.db = db;
	hmmerparams.dbtype = req.body.dbtype;


	hmmerparams.psicheck = convertBoolean( req.body.psicheck, false );
	hmmerparams.psiiter = req.body.psiiter;
	//hmmerparams.remote = convertBoolean( req.body.remotecheck, false );
	//hmmerparams.evalue = req.body.evalue;
	// hmmerparams.max_target_seqs = req.body.max_target_seqs;
	
	var organism = parseInt( req.body.organism, 10 );

	if ( organism && ( organism !== 0 || organism === 'NaN' ) ) {
		
		// TODO: Here we should allow filtering by taxon ID
		runHmmer( hmmerparams, req, res );
		
	} else {
		runHmmer( hmmerparams, req, res );
	}

};

function runHmmer( params, req, res ) {

	var config, opts, db, fullpath;
	config = req.app.set('config');

	// TODO. Better handling params
	var hmmer_params = {};
	
	var binary = "phmmer";
	var dbtype = "prot";
	
	if ( params.binary ) {
		binary = params.binary;
	}
	
	if ( params.dbtype ) {
		dbtype = params.dbtype;
	}

	if ( params.db ) {
		db = params.db;
	}

	if ( params.psicheck && binary == "phmmer" ) {
		binary = "jackhmmer";
		
		if ( params.psiiter && ( params.psiiter == ( parseInt( params.psiiter, 10 ) ) ) ) {
			hmmer_params.num_iterations = params.psiiter;
		}
	}

	if ( params.evalue ) {
		hmmer_params.evalue = params.evalue;
	}
	if ( params.max_target_seqs && ( params.max_target_seqs == ( parseInt( params.max_target_seqs, 10 ) ) ) ) {
		hmmer_params.max_target_seqs = params.max_target_seqs;
	}

	hmmer_params.notextw = "";
	
	var socketio = config.socketio; // Wheter to use this socketio or not;

	var seq = req.body.seq;

	// TODO: CHECK IF SEQUENCE is NUCLEIC ACID

	var program = config.exec.path + "/" + binary;
	var io = req.app.set('io');

	var execparams = Object.assign({}, hmmer_params);

	hmmer_params.db = db;
	hmmer_params.binary = binary;
	hmmer_params.dbtype = dbtype;
	
	var DBpath = null;
	
	if ( params.remote ) {
		execparams.remote = ""; // Empty tag
		hmmer_params.remote = true;
	} else {
		var DBcontainer = functions.getPath( db, config.db.list ); // Get path from array
		DBpath = DBcontainer.path;
		hmmer_params.remote = false;
	}
	
	// Using --
	strParams = joinParams( execparams, "--" );
	
	
	var stream = temp.createWriteStream();
	stream.write( [ processTextInput( seq ) ].join("\n") );
	
	if ( stream ) {
		strParams = strParams + " " + stream.path;
	}
	
	if ( DBpath ) {
		strParams = strParams + " " + DBpath;
	}
	
	
	var child = spawn( 'node', [ './pipe.js', JSON.stringify( [{ "app": program, "params": strParams }] ) ] );

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

		stream.end();
		
		var object = {};
				
		if ( ( output.match(/report/g)||[]).length > 1 ) {
			// output = processMultiOutput( output ); TODO: Temporary outp
			object = hmmer3process.init( output );
			object = addMultiSeqs( object, seq, false );
		} else {
			// console.log( output );
			object = hmmer3process.init( output );

			if ( ! seq.startsWith( ">" ) ) {
				object = addMultiSeqs( object, seq, true );
			} else {
				object = addMultiSeqs( object, seq, false );
			}
		}
		
		object.params = hmmer_params;
		
		var digest = hash.digest( object );
		var newObj = {};
		newObj._id = digest;
		newObj.meta = config.meta; // Adding meta information
		newObj.type = "hmmer";
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

function addMultiSeqs( object, seqs, nofasta ) {

	var listSeqs = [];
	if ( nofasta ) {
		listSeqs.push( { "seq": seqs, "id": 0, "name": "Seq" } );
	} else {
		listSeqs = fasta.parse( seqs );
	}

	if ( object.hasOwnProperty("HMMEROutput") ) {

		var outputReports = object["HMMEROutput"];
		
		if ( outputReports instanceof Array ) { //If array
			
			for ( var f = 0; f < outputReports.length; f = f + 1 ) {
		
				if ( listSeqs[f] ) {
		
					if ( listSeqs[f].hasOwnProperty("seq") ) {
						object["HMMEROutput"][f].seq = listSeqs[f].seq;
					}
					if ( listSeqs[f].hasOwnProperty("id") ) {
						object["HMMEROutput"][f].id = listSeqs[f].id;
					}

					object["HMMEROutput"][f] = assignSeqName( listSeqs[f], object["HMMEROutput"][f] );
		
				}
			}
			
		}
		
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
				for ( var k in seqContainer.ids ) {
					if ( seqContainer.ids.hasOwnProperty( k ) ) {
						if ( typeof seqContainer.ids[k] !== 'undefined' ) {
							nameArr.push( k + "|" + seqContainer.ids[k] );
						}
					}
				}
				if ( nameArr.length === 0 ) {
					if ( seqContainer.hasOwnProperty("id") ) {
						object.name = "Seq" + String( seqContainer.id );
					} else {
						object.name = "Seq";
					}
				} else {
					object.name = nameArr.join("|");
				}
			} else {
				if ( seqContainer.hasOwnProperty("id") ) {
					object.name = "Seq" + String( seqContainer.id );
				} else {
					object.name = "Seq";
				}
			}
		}
	}

	return object;
}

function convertBoolean( string, defaultval ) {
	
	var val;
	
	if ( string == 'true' ) {
		val = true;
	} else if ( string == 'false' ){
		val = false;
	} else {
		val = defaultval;
	}
	
	return val;
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


hmmer3process.init = function( text, limit=1000 ) {

	let data = [];
	let alignments = false;

	let seqiter = -1;
	let domiter = -1;
	let alniter = -1;

	let title = "";
	let length = 0;
	let roundnum = 0;
	
	let qstart;
	let qend;
	
	let hstart;
	let hend;

	let noSkip = true;

	let hit_title = "";
	let hit_prev_title = "";

	let lines = text.split("\n");

	for ( let line of lines ) {

		if ( line.startsWith("#") ) {
			// It's a comment, so continue
			continue;
		}

		// If starts with "Query:"
		if ( line.startsWith("Query:") ) {

			let parts = line.split(/\s+/);
			title = parts[1];
			let prelength = parts[2];
			//print prelength
			prelength = prelength.replace("[L=", "");
			length = parseInt( prelength.replace("]", ""), 10 );

			continue;
		}

		// After ->  Domain annotation for each sequence (and alignments):
		if ( line.startsWith("Domain annotation for each sequence") ) {

			alignments = true;
			
			data.push( { } );
			data[roundnum]["iter_num"] = roundnum + 1;
			data[roundnum]["search"] = {};
			data[roundnum]["search"]["query_title"] = title;
			data[roundnum]["search"]["query_len"] = length;
			data[roundnum]["search"]["hits"] = [];
		
			seqiter = -1;
			domiter = -1;
			alniter = -1;
	
			continue;
		}

		// End -> Internal pipeline statistics summary:
		if ( line.startsWith("Internal pipeline statistics summary:") ) {

			alignments = false;
			continue;
		}


		// End -> Internal pipeline statistics summary:
		if ( line.startsWith("@@ Round:") ) {

			roundnum = roundnum + 1;
			continue;
		}


		// HIT -> Check if repeated!
		// if ">>" -> Process entry
		if ( line.startsWith(">>") ) {

			hit_title = line.trim().replace(">> ", "");
			domiter = -1;

			if ( hit_title != hit_prev_title ){

				seqiter = seqiter + 1;
				
				if ( seqiter >= limit ) {
					noSkip = false;
					continue;
				}

				// Positions of start and end
				qstart = 0;
				qend = 0;
				qstartPos = 0;
				qendPos = 0;

				// Positions of start and end
				hstart = 0;
				hend = 0;
				hstartPos = 0;
				hendPos = 0;

				// print seqiter

				data[roundnum]["search"]["hits"].push( {} ); // We append
				data[roundnum]["search"]["hits"][seqiter]["num"] = seqiter + 1;
				data[roundnum]["search"]["hits"][seqiter]["description"] = [];
				
				let titlePart = line.trim().replace(">> ", "");
				
				for ( let part of titlePart.split(">") ) {
					
					part = part.trim();
					
					let desc = {};
					
					let parts = part.split(" ", 2);
					
					desc.id = parts[0];
					desc.title = parts[1];

					data[roundnum]["search"]["hits"][seqiter]["description"].push( desc );

				}
				
				data[roundnum]["search"]["hits"][seqiter]["hsps"] = [];
				
				hit_prev_title = hit_title;

				noSkip = true;
			} else {
				noSkip = false;

			}

			continue;

		}

		if ( line.match( /^\s+\=\=\sdomain\s\d+/ ) && noSkip ) {
			domiter = domiter + 1;
			alniter = 0;
			let scoreinfo = line.match(/^\s*\=\=\sdomain\s(\d+)\s+score\:\s+(\S+)\sbits\;\s+conditional\s+E-value\:\s+(\S+)/);
			
			data[roundnum]["search"]["hits"][seqiter]["hsps"].push( {} );

			//print scoreinfo.groups()
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["num"] = parseInt( scoreinfo[1], 10 );
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["score"] = parseFloat( scoreinfo[2] );
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["evalue"] = parseFloat( scoreinfo[3] );
						
			continue;
		}


		let titleRe = new RegExp( "^\\s*"+title );
		
		if ( line.match( titleRe ) && alniter === 0 ) {
		
			alniter = alniter + 1;
			
			let qstartRe = new RegExp( /^\s*\S+\s*\d+\s/ );
			
			let qstartMatch = qstartRe.exec( line );
			qstartPos = qstartMatch.index + qstartMatch[0].length;

			let qstartRetake = new RegExp( /^\s*\S+\s*(\d+)\s/ );
			let qstartTake = line.match( qstartRetake );
			
			qstart = parseInt( qstartTake[1], 10 );

			let qendRe = new RegExp( /\s\d+\s*$/ );

			let qendMatch = qendRe.exec( line );
			qendPos = qendMatch.index;
			
			let qendRetake = new RegExp( /\s(\d+)\s*$/ );
			let qendTake = line.match( qendRetake );
			qend = parseInt( qendTake[1], 10 );
		
			let lineArr = line.split("");
			let qseq = lineArr.slice( qstartPos, qendPos ).join("");
			
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_from"] = qstart;
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_to"] = qend;
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["qseq"] = qseq;
			
			continue;
		
		}
		
		if ( line.match( /^\s*.*\s*$/ ) && alniter === 1 ) {

			let lineArr = line.split("");
			let mseq = lineArr.slice( qstartPos, qendPos ).join("");
			
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["midline"] = mseq;
		
			alniter = alniter + 1
			continue;
		}
		
		if ( line.match( /^\s*\S+\s*\d+\s.*\s\d+\s*/ ) && alniter === 2 ) {

			alniter = alniter + 1;

			let hstartRe = new RegExp( /^\s*\S+\s*\d+\s/ );
			
			let hstartMatch = hstartRe.exec( line );
			hstartPos = hstartMatch.index + hstartMatch[0].length;

			let hstartRetake = new RegExp( /^\s*\S+\s*(\d+)\s/ );
			let hstartTake = line.match( hstartRetake );
			
			hstart = parseInt( hstartTake[1], 10 );

			let hendRe = new RegExp( /\s\d+\s*$/ );

			let hendMatch = hendRe.exec( line );
			hendPos = hendMatch.index;
			
			let hendRetake = new RegExp( /\s(\d+)\s*$/ );
			let hendTake = line.match( hendRetake );
			hend = parseInt( hendTake[1], 10 );
		
			let lineArr = line.split("");
			let hseq = lineArr.slice( hstartPos, hendPos ).join("");
			
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_from"] = hstart;
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_to"] = hend;
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hseq"] = hseq;
			
			continue;
		}
	}

	outcome = {};
	outcome["HMMEROutput"] = [];
	outcome["HMMEROutput"].push( {} );
	outcome["HMMEROutput"][0]["report"] = {};
	outcome["HMMEROutput"][0]["report"]["results"] = {};
	outcome["HMMEROutput"][0]["report"]["results"]["iterations"] = data;

	return outcome;

};



