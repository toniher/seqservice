/*globals console io $ document */

$(document).ready( function(){

	var basepath = $("#blast-form").data("basepath");
	var socketio = $("#blast-form").data("socketio");

	// Writing tree
	if ( socketio ){
		
		var socket = io.connect( { path: basepath + "/socket.io" } );
		//socket.on('align', function(message) {
		//	//if ( $("#align-data").find(".results").length === 0 ) { // If nothing append output
		//		// TODO: Handle continuous output
		//		console.log( message );
		//	//} else {
		//	//	console.log( "Huis" );
		//	//}
		//});
		//
		socket.on('tree', function( message ) {
			printTree( message );
		});

	}

});

$(function() {
	$(document).on( "click", '#align-exec', function() {

		var exec = $(this).attr("data-align-exec");
		var seqs = [];

		var socketio = $("#blast-form").data("socketio");


		// TODO: Possibility to add query sequence as well

		$("#blast-data input.hitcheck:checked").each( function( i ) {

			var hit = $(this).parent();
			var id = $(hit).children(".id").first().text();

			// TODO: Check if too complex
			var block = $(hit).children(".hsps").first().children('.hsp').first().children('.block');
			// we take the hit
			var seq = $(block).children('.align').first().children('.seq-hit').first().children('.actual').first().text();

			var seqobj = { id: id, seq: seq };

			if ( $(hit).children(".taxid").length > 0 ) {
				seqobj.taxid = parseInt( $(hit).children(".taxid").first().text(), 10 );
			}

			seqs.push( seqobj );

		});

		// Params

		var align = {};
		align.app = "muscle"; // For now only
		align.params = "-phyi -in -"; // String params for now

		var tree = {};
		tree.app = "phyml-aa"; // For now only

		tree.params = ""; // String params for now


		// Attach seq, make it optional 
		var blast = $("#blast");

		if ( blast && blast.length > 0 ) {

			var seq = $(blast).data("seq");
			var program = $(blast).data("program");
			
			var seqobj = { id: "Query", seq: seq  };
			
			if ( program === "blastn" ) {
				tree.app = "phyml";
			}
			
			seqs.push( seqobj );
		}

		var params = { seqs: seqs, align: align, tree: tree };

		var exec = "/seqservice/align"; // TODO: to change and get base

		$("#align-data").empty();
		$("#tree-data").empty();
		$("#treeview-data").empty();

		$.post( exec, params ).done( function( data ) {

			if ( ! socketio ){
				printTree( JSON.stringify( data ) ); //TODO: Fix JSON and so
			}

		});
		
		$("#blast-data").hide(); //Hide alignment

	});
});

function printTree( message ) {

	var input = JSON.parse( message );

	$("#tree-data").empty();
	// $("#tree-data").append( message );

	// Adding view tree
	$("#treeview-data").empty();

	var t = tnt.tree();
	var theme = tnt_theme()
		.newick(input.tree)
			theme(t, document.getElementById('treeview-data'));

}

var tnt_theme = function () {
	
	var newick; // The newick tree is now undefined by default
	
	var theme = function (t, div) {
		t
			.data (tnt.tree.parse_newick(newick))
			.layout (tnt.tree.layout.vertical()
					 .width(650)
					)
			.label (tnt.tree.label.text()
					.height(15)
				   );
		t(div);
	};
	
	theme.newick = function (new_newick) {
		newick = new_newick;
		return theme;
	};
	
	return theme;
};

