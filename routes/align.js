var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var $p = require('procstreams');

// Main function for handling alignments
exports.performAlign = function (req, res) {

	var config;
	config = req.app.set('config');

	var alnparams = {};

	alnparams.seqs = req.body.seqs;
	alnparams.align = {};
	alnparams.align.app = req.body.align.app;
	alnparams.align.params = req.body.align.params;
	alnparams.tree = {};
	alnparams.tree.app = req.body.tree.app;
	alnparams.tree.params = req.body.tree.params;
	alnparams.treeview = {};
	alnparams.treeview.app = req.body.treview.app;
	alnparams.treeview.params = req.body.treview.params;

	// Generate FASTA file (consider taxid if available)
	if ( alnparams.seqs && alnparams.seqs.length > 0 ) {

		var seqs = alnparams.seqs;
		var fastaText = "";
		for ( var s=0; s < seqs.length; s = s + 1 ){
			// Important is seq
			if ( seqs[s].hasOwnProperty('seq') ) {
				
				
				if ( seqs[s].hasOwnProperty('id') ) {
					fastaText = fastaText + ">" + seqs[s].id;

					if ( seqs[s].hasOwnProperty('taxid') ) {
						fastaText = fastaText + " [" + seqs[s].taxid + "]";
					}
				} else {
					// In case no ID
					fastaText = fastaText + ">seq" + s;
				}

				fastaText = fastaText + "\n" + seqs[s].seq + "\n";
			}
		}

		// We have an align application
		if ( alnparams.align.app ){
			
			var pipeapps = [];
			var alnapp = {};
			alnapp.app = alnparams.align.app;
			alnapp.params = alnparams.align.params;

			pipeapps.push( alnapp );

			if ( alnparams.tree.app ){

				var treeapp = {};
				treeapp.app = alnparams.tree.app;
				treeapp.params = alnparams.tree.params;

				pipeapps.push( treeapp );

				if ( alnparams.treeview.app ){
				
					var treeviewapp = {};
					treeviewapp.app = alnparams.treeview.app;
					treeviewapp.params = alnparams.treeview.params;

					pipeapps.push( treeviewapp );
					runPipe( pipeapps, function( object ) {
						console.log( object );
					});

				} else {
					// No treeview application
					runPipe( pipeapps, function( object ) {
						console.log( object );
					});
				}
			} else {
				// No tree application
				runPipe( fastaText, pipeapps, function( object ) {
					console.log( object );
				});
			}

		} else {
			// No align application
		}

	} else {
		// TODO: No seq code
	}


	// Run alignment from input file
	

	// Run tree

	// Run treeview

	// TODO process

};




function runPipe( baseText, apps, callBack ) {

	var resp = "";

	var commandline = $p("echo \"" + baseText + "\"" );

	for ( var a = 0; a < apps.length[0]; a = a + 1 ) {
		var command = apps[a].app + " " + ( apps[a].params ).join( " " );

		commandline = commandline.pipe( command );
	}

	commandline.data( function(err, stdout, stderr) {
		if ( err ) {
			console.log("ERR");
			console.log( stderr.toString() );
		} else {
			// console.log("OUT");
			resp += stdout.toString();
			callBack(resp);
		}
	});

}