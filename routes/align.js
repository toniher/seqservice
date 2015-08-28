var functions = require('../functions/index.js');
var temp = require('temp'),
    fs   = require('fs');

var $p = require('procstreams');

// Main function for handling alignments
exports.performAlign = function (req, res) {

	var config;
	config = req.app.set('config');

	var methodlist = config.exec.method;

	var alnparams = {};

	// TODO: Proper checking of params here

	if ( ! req.body.seqs ) {
		// TODO: No seqs
	}

	alnparams.seqs = req.body.seqs;

	if ( req.body.align ) {
		alnparams.align = {};
		alnparams.align.app = methodlist[ req.body.align.app ];
		alnparams.align.params = req.body.align.params;
	}

	if ( req.body.tree ) {
		alnparams.tree = {};
		alnparams.tree.app = methodlist[ req.body.tree.app ];
		alnparams.tree.params = req.body.tree.params;
	}

	if ( req.body.treeview ) {
		alnparams.treeview = {};
		alnparams.treeview.app = methodlist[ req.body.treview.app ];
		alnparams.treeview.params = req.body.treview.params;
	}

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
		if ( alnparams.align && alnparams.align.app ){
			
			var pipeapps = [];
			var alnapp = {};
			alnapp.app = alnparams.align.app;
			alnapp.params = alnparams.align.params;

			pipeapps.push( alnapp );

			if ( alnparams.tree && alnparams.tree.app ){

				var treeapp = {};
				treeapp.app = alnparams.tree.app;
				treeapp.params = alnparams.tree.params;

				pipeapps.push( treeapp );

				if ( alnparams.treeview && alnparams.treeview.app ){
				
					var treeviewapp = {};
					treeviewapp.app = alnparams.treeview.app;
					treeviewapp.params = alnparams.treeview.params;

					pipeapps.push( treeviewapp );
					console.log("TREEVIEW");
					runPipe( fastaText, pipeapps, function( object ) {
						console.log( object );
					});

				} else {
					// No treeview application
					console.log("TREE");
					runPipe( fastaText, pipeapps, function( object ) {
						console.log( object );
					});
				}
			} else {
				// No tree application
				console.log("ALN");
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
	console.log( "echo \"" + baseText + "\"" );

	for ( var a = 0; a < apps.length; a = a + 1 ) {
		var command = apps[a].app + " " + apps[a].params;
		console.log( command );

		commandline = commandline.pipe( command );
	}

	commandline.data( function(err, stdout, stderr) {
		if ( err ) {
			console.log("ERR");
			console.log( stderr.toString() );
		} else {
			resp += stdout.toString();
			callBack(resp);
		}
	});

}