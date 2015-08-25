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
	alnparams.align.app = req.body.align.app;
	alnparams.align.params = req.body.align.params;
	alnparams.tree.app = req.body.tree.app;
	alnparams.tree.params = req.body.tree.params;
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

				}
				if ( seqs[s].hasOwnProperty('taxid') ) {

				}
			}
		}
	} else {
		// TODO: No seq code
	}


	// Run alignment from input file
	

	// Run tree

	// Run treeview

	// TODO process

};

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
			console.log("ERR");
			console.log( stderr.toString() );
		} else {
			// console.log("OUT");
			resp += stdout.toString();
			callBack(resp);
		}
	
	});

}