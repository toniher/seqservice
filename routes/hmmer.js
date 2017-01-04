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
	
	console.log( db );
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
		
		console.log( output );
		
		if ( ( output.match(/report/g)||[]).length > 1 ) {
			// output = processMultiOutput( output ); TODO: Temporary outp
			object = JSON.parse(output);
			object = addMultiSeqs( object, seq, false );
		} else {
			object = JSON.parse(output);
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
		
		functions.returnSocketIO( socketio, io, "hmmer", res, JSON.stringify( newObj ) ); 
	
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


hmmer3process.init = function( text, limit ) {

	let data = [];
	let alignments = false;

	let seqiter = -1;
	let domiter = -1;
	let alniter = -1;

	let title = "";
	let length = 0;
	let roundnum = 0;

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
			prelength = parts[2];
			//print prelength
			let prelength = prelength.replace("[L=", "");
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

				// Positions of start and end
				hstart = 0;
				hend = 0;

				// print seqiter

				data[roundnum]["search"]["hits"].push( {} ); // We append
				data[roundnum]["search"]["hits"][seqiter]["num"] = seqiter + 1;
				data[roundnum]["search"]["hits"][seqiter]["description"] = [];
				data[roundnum]["search"]["hits"][seqiter]["description"].push( {} );
				data[roundnum]["search"]["hits"][seqiter]["description"][0]["title"] = line.trim().replace(">> ", ""); // Need to process as well
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
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["num"] = parseInt( scoreinfo[0], 10 );
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["score"] = parseFloat( scoreinfo[1] );
			data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["evalue"] = parseFloat( scoreinfo[2] );
			continue;
		}


		//let titleRe = new RegExp( "^\s*"+title );
		//
		//if ( line.match( titleRe ) && alniter === 0 ) {
		//
		//	let queryinfo = line.match( /^\s*\S.*\s*(\d+)\s(.*)\s(\d+)\s*$/ );
		//	alniter = alniter + 1;
		//	pstartRe = new RegExp( "^\s*"+title+"\S*\s*\d+\s" );
		//	qstart = line.match(pstartRe)[-1]
		//
		//	
		//
		//}
		//// TODO: Finish translating from Python
		////# And different domains
		//
		//	#qstart = re.search(pstart, line).end()
		//	#print qstart
		//	#print line[qstart]
		//
		//	qstart = re.compile("^\s*\S+\s*\d+\s")
		//	qstart = re.search(qstart, line).end()
		//
		//
		//	qend = re.compile("\s\d+\s*$")
		//	qend = re.search(qend, line).start() - 1
		//
		//	#print qend
		//	#print line[qend]
		//
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_from"] = int( qstart )
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_to"] = int( qend )
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["qseq"] = line[qstart:qend+1]
		//
		//	continue
		//
		//if re.match( "^\s*.*\s*$", line ) and alniter == 1 :
		//	#print line
		//	#print "mid: *"+line[qstart:qend+1] + "*"
		//
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["midline"] = line[qstart:qend+1]
		//
		//	alniter = alniter + 1
		//	continue
		//
		//if re.match( "^\s*\S+\s*\d+\s.*\s\d+\s*", line ) and alniter == 2 :
		//
		//	hitinfo = re.match( "^\s*\S+\s*(\d+)\s(.*)\s(\d+)\s*$", line );
		//	#print hitinfo.groups()
		//
		//	alniter = alniter + 1
		//	hstart = re.compile("^\s*\S+\s*\d+\s")
		//	hstart = re.search(hstart, line).end()
		//	#print hstart
		//	#print line[hstart]
		//
		//	hend = re.compile("\s\d+\s*$")
		//	hend = re.search(hend, line).start() - 1
		//	#print hend
		//	#print line[hend]
		//
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_to"] = int( hstart )
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_end"] = int( hend )
		//
		//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hseq"] = line[hstart:hend+1]
		//
		//	continue

	}

	outcome = {};
	outcome["HMMEROutput"] = {};
	outcome["HMMEROutput"]["report"] = {};
	outcome["HMMEROutput"]["report"]["results"] = {};
	outcome["HMMEROutput"]["report"]["results"]["iterations"] = data;

	return outcome;

};



