var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

exports.getDBlist = function(req, res) {

	var config = req.app.set('config');
	functions.returnJSON( res, config.db.list );

};

// TODO: Some refactorize work could be needed
// TODO: Handle numeric values

exports.getBlastDBcmd = function(req, res) {

	var config = req.app.set('config');

	var outcome = {};

	var download = false; // Whether files are downloaded
	
	var split = true; // Whether FASTA sequence is split

	var db = null;

	if ( req.body.db ) {
		db = req.body.db;
	}
	if ( req.params.db ) {
		db = req.params.db;
	}

	var dbtype = null;
	if ( req.body.dbtype ) {
		dbtype = req.body.dbtype;
	}
	if ( req.params.dbtype ) {
		dbtype = req.params.dbtype;
	}

	var blastdbcmd = null;
	
	var method = null;
	if ( req.body.method ) {
		method = req.body.method;
	}
	if ( req.params.method ) {
		method = req.params.method;
	}
	
	if ( method && config.exec["method"][ method ] ) {
		blastdbcmd = config.exec["method"][ method ];
	} else {
		
		if ( config.exec["method"][ "blastdbcmd" ] ) {
			blastdbcmd = config.exec["method"][ "blastdbcmd" ];
		} else {
			outcome.msg = "Error. No retrieval method defined!";
			functions.returnJSON( res, outcome );
		}
		
	}

	// Code for output of information
	// 0 -> sequence
	// 1 -> fasta
	// 2 -> fasta download

	// Format FASTA
	var outfmt = "%f";
	var fmt = 1;
	if ( req.body.fmt ) {
		fmt = parseInt( req.body.fmt, 10 );
	}
	if ( req.params.fmt ) {
		fmt = parseInt( req.params.fmt, 10 );
	}

	if ( fmt === 2 ) {
		download = true;
	}
	
	// Let's pass directly entry
	var entry = null;
	
	if ( req.body.entry ) {
		entry = req.body.entry;
	}
	if ( req.params.entry ) {
		entry = req.params.entry;
	}

	// Let's pass batch of entry
	var entry_batch = null;
	
	if ( req.body.entry_batch ) {
		entry_batch = req.body.entry_batch;
	}
	if ( req.params.entry_batch ) {
		entry_batch = req.params.entry_batch;
	}

	// Stop if none
	if ( ( !entry || entry === '' ) && ! entry_batch ) {
		outcome.msg = "Error. No entry!";
		functions.returnJSON( res, outcome );
	}

	// Extra params
	
	var range = "1-";
	var rangeval = "";
	
	if ( req.body.range ) {
		rangeval = req.body.range;
	}
	if ( req.params.range ) {
		rangeval = req.params.range;
	}
	
	if ( rangeval !== "" ) {
		if ( rangeval !== "0" ) {
			range = rangeval;
		}
	}
	
	var length = "";
	var lengthval = "";
	// TODO: Handle numeric
	if ( req.body.line ) {
		lengthval = req.body.line;
	}
	if ( req.params.line ) {
		lengthval = req.params.line;
	}
		
	if ( lengthval !== "" ) {
		var lineval = parseInt( lengthval, 10 );

		if ( lineval ) {
			length = " -line_length "+lengthval;
			if ( lineval < 1 ) {
				split = false;
			}
		} else {
			split = false;
		}
	}

	if ( ! db ) {
		outcome.msg = "DB not defined.";
		functions.returnJSON( res, outcome );
	} else {

		var targetDB = functions.getPath( db, config.db.list ); // Get path from array
		var fullpath = targetDB.path; // Get path
	
		// Let's discover dbtype
		if ( ! dbtype ) {
			dbtype = functions.getDbtype( db, config.db.list );
		}
	
		// TODO: Check file exists!
		if ( ! fullpath ) {
			outcome.msg = "DB " + db + " does not exist.";
			functions.returnJSON( res, outcome );
		} else {
	
			// TODO: for samtools ->
			// ONE: samtools faidx base seq
			// MANY: xargs samtools faidx base < list
			// PENDING RANGE and LENGTH
	
			if ( ! dbtype ) {
				dbtype = config.db.def;
			}
	
			var cmd;
			var download_title = "download";
	
			if ( ! entry_batch ) {
	
				if ( entry.indexOf('+') !== -1  || Array.isArray( entry ) ) {
	
					var listID = [];
	
					if ( ! Array.isArray( entry ) ) {
						listID = entry.split("+");
					} else {
						listID = entry;
					}
	
					if ( listID.length > 0 ) {

						if ( listID.length === 1 ) {
							download_title = listID[0]; //Only one selection.
						}

						temp.track();
	
						// Process the data (note: error handling omitted)
						temp.open('tmp', function(err, info) {
							if (!err) {
								fs.write(info.fd, listID.join("\n"), function( err ) { if ( err ) { console.error( err ) } } );
								fs.close(info.fd, function(err) {
									// Entry batch generated automatically
									if ( method === 'samtools ') {
										cmd = "xargs "+ blastdbcmd + " faidx "+ fullpath + " < " + info.path;
									} else {
										cmd = blastdbcmd+" -dbtype " + dbtype+" -db " + fullpath+" -entry_batch " + info.path + " -outfmt "+outfmt;
									}
									
									execBlastChild( cmd, req, res, { "fmt": fmt, "download": download, "multi": true, "title": download_title, "split": split } );
								});
							}
						});
					}
				} else {
				
					if ( method === 'samtools' ) {
						if ( range === "1-") {
							range = "";
						} else {
							range = ":" + range;
						}
						cmd = blastdbcmd + " faidx "+ fullpath + " " + entry+range ;
					} else {
						cmd = blastdbcmd+" -dbtype " + dbtype+" -db "+fullpath+" -entry "+entry+" -range "+range+length+" -outfmt "+outfmt;
					}
					
					execBlastChild( cmd, req, res, { "fmt": fmt, "download": download, "title": entry, "split": split } );
				}
			} else {
				// Entry batch passed as param
				if ( method === 'samtools') {
					cmd = "xargs "+ blastdbcmd + " faidx "+ fullpath + " < " + entry_batch;
				} else {
					cmd = blastdbcmd+" -dbtype " + dbtype+" -db " + fullpath+" -entry_batch " + entry_batch+" -outfmt " + outfmt;
				}
				
				execBlastChild( cmd, req, res, { "fmt": fmt, "download": download, "multi": true, "title": download_title, "split": split } );
			}
		}

	}
};


function execBlastChild( cmd, req, res, params ) {

	var outcome = {};

	// external call to BLASTDBCMD http://nodejs.org/api/all.html#all_child_process_exec_command_options_callback
	var exec = require('child_process').exec, child;

	child = exec( cmd, {maxBuffer: 1024 * 1024 * 50}, function (error, stdout, stderr) {
		if (error === null) {

			if ( params.download ) {

				if (req.xhr || req.headers.accept.indexOf('json') > -1) {
					// send your xhr response here
					outcome.download = true;

					// Write temp file
					temp.open('tmp', function(err, info) {
						if (!err) {
							fs.write(info.fd, stdout, function( err ) { if ( err ) { console.error( err ) } } );
							fs.close(info.fd, function(err) {
								if ( ! err ) {
									outcome.path = info.path;
									outcome.filename = params.title;
									functions.returnJSON( res, outcome );
								} else {
									outcome.msg = "Error! "+error;
									functions.returnJSON( res, outcome );
								}
							});
						} else {
							outcome.msg = "Error! "+error;
							functions.returnJSON( res, outcome );
						}
					});
					
				} else {
					// send your normal response hereç
					functions.downloadFasta( res, stdout, params.title );
				}

			} else {
				outcome = processFasta( stdout, params.split );

				if ( parseInt( params.fmt, 10 ) === 0 ) {
					delete( outcome.def );
				}
				functions.returnJSON( res, outcome );
			}

		} else {
			outcome.msg = "Error! "+error;
			functions.returnJSON( res, outcome );
		}
	});

}

function processFasta( stringSeq, split ) {

	var fastaSeq = [];

	fastaSeq = stringSeq.split(">");

	var newSeq = [];

	// Clean array
	for ( var f = 0; f < fastaSeq.length; f = f + 1 ) {
		if ( fastaSeq[f] && fastaSeq[f] !== "" ) {

			newSeq.push( fastaSeq[f] );
		}
	}

	// Replace
	fastaSeq = newSeq;

	for ( var f = 0; f < fastaSeq.length; f = f+1 ) {

		fastaSeq[f] = fastaSeq[f].trim();
		fastaSeq[f] = ">" + fastaSeq[f];

		var splitvar = fastaSeq[f].split("\n");
		// we include header and seq
		var hash = {};
		hash.def = splitvar[0].trim();
		// we ignore possibility of comment
		
		// Delimiter
		var delimiter = "";
		if ( split ) {
			delimiter = "\n";
		}
		
		hash.seq = splitvar.slice( 1, splitvar.length ).join( delimiter ).trim();

		fastaSeq[f] = hash;
	}

	// Return array or hash
	if ( fastaSeq.length > 1 ) {
		return fastaSeq;
	} else {
		return fastaSeq[0];
	}

}

