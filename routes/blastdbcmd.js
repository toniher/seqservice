var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

exports.getDBlist = function(req, res) {

	var config = req.app.set('config');
	functions.returnJSON( res, config.db.list );

};

// TODO: Some refactorize work could be needed

exports.getBlastDBcmd = function(req, res) {

	var config = req.app.set('config');

	var range = "1-";
	var outcome = {};

	var download = false;

	var db = config.db.def;
	if ( req.body.db ) {
		db = req.body.db;
	}
	if ( req.params.db ) {
		db = req.params.db;
	}

	// Code for output of information
	// 0 -> sequence
	// 1 -> fasta
	// 2 -> fasta download

	// Format FASTA
	var outfmt = "%f";
	var fmt = 1;
	if ( req.body.fmt ) {
		var fmt = req.body.fmt;
	}
	if ( req.params.fmt ) {
		var fmt = req.params.fmt;
	}

	if ( fmt === "2" ) {
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

	console.log( entry_batch );

	// Stop if none
	if ( ( !entry || entry === '' ) && ! entry_batch ) {
		var outcome = {};
		outcome.msg = "Error. No entry!";
		functions.returnJSON( res, outcome );
	}

	// Extra params
	if ( req.body.range ) {
		range = req.body.range;
	}
	if ( req.params.range ) {
		range = req.params.range;
	}

	var length = "";
	if ( req.body.line ) {
		length = " -line_length "+req.body.line;
	}
	if ( req.params.line ) {
		length = " -line_length "+req.params.line;
	}

	var targetDB = functions.getPath( db, config.db.list ); // Get path from array
	var fullpath = targetDB.path; // Get path

	// TODO: Check file exists!
	if ( fullpath === '' ) {
		outcome.msg = "DB " + db + " does not exist.";
		functions.returnJSON( res, outcome );
	} else {

		var blastdbcmd = config.exec.blastdbcmd;

		var cmd;

		if ( ! entry_batch ) {

			if ( entry.indexOf('+') !== -1 ) {

				var listID = entry.split("+");

				if ( listID.length > 0 ) {
					temp.track();

					// Process the data (note: error handling omitted)
					temp.open('tmp', function(err, info) {
						if (!err) {
							fs.write(info.fd, listID.join("\n"));
							fs.close(info.fd, function(err) {
								// Entry batch generated automatically
								cmd = blastdbcmd+" -db "+fullpath+" -entry_batch "+info.path+" -outfmt "+outfmt;
								execBlastChild( cmd, res, { "fmt": fmt, "download": download, "multi": true, "title": "download" } );
							});
						}
					});
				}
			} else {
				cmd = blastdbcmd+" -db "+fullpath+" -entry "+entry+" -range "+range+length+" -outfmt "+outfmt;
				execBlastChild( cmd, res, { "fmt": fmt, "download": download, "title": entry } );
			}
		} else {
			// Entry batch passed as param
			cmd = blastdbcmd+" -db "+fullpath+" -entry_batch "+entry_batch+" -outfmt "+outfmt;
			execBlastChild( cmd, res, { "fmt": fmt, "download": download, "multi": true, "title": "download" } );
		}
	}
};


function execBlastChild( cmd, res, params ) {

	var outcome = {};

	// external call to BLASTDBCMD http://nodejs.org/api/all.html#all_child_process_exec_command_options_callback
	var exec = require('child_process').exec, child;

	child = exec( cmd, {maxBuffer: 1024 * 1024 * 50}, function (error, stdout, stderr) {
		if (error === null) {

			if ( params.download ) {
				functions.downloadFasta( res, stdout, params.title );
			} else {
				outcome = processFasta( stdout );

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

function processFasta( stringSeq ) {

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
		hash.seq = splitvar.slice( 1, splitvar.length ).join("\n").trim();

		fastaSeq[f] = hash;
	}

	// Return array or hash
	if ( fastaSeq.length > 1 ) {
		return fastaSeq;
	} else {
		return fastaSeq[0];
	}

}

