/*globals console io $ document */

$(document).ready( function(){

	var basepath = $("#blast-form").data("basepath");

	var socket = io.connect( { path: basepath + "/socket.io" } );
	socket.on('align', function(message) {
		//if ( $("#align-data").find(".results").length === 0 ) { // If nothing append output
			// TODO: Handle continuous output
			console.log( message );
		//} else {
		//	console.log( "Huis" );
		//}
	});

	socket.on('tree', function(message) {
		// if ( $("#tree-data").find(".results").length === 0 ) { // If nothing append output
			// TODO: Handle continuous output
			$("#tree-data").empty();
			$("#tree-data").append( message );
		//} else {
		//	console.log( "Huis" );
		//}
	});

});

$(function() {
	$("#blast-data").on( "click", '#align-exec', function() {

		console.log("ALIGN");
		var exec = $(this).attr("data-align-exec");
		var seqs = [];

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

		var align = {};
		align.app = "muscle"; // For now only
		align.params = "-phyi -in -"; // String params for now

		var tree = {};
		tree.app = "phyml-aa"; // For now only
		tree.params = ""; // String params for now

		var params = { seqs: seqs, align: align, tree: tree };

		var exec = "/seqservice/align"; // TODO: to change and get base

		$("#align-data").empty();
		console.log( params );
		$.post( exec, params );
	});
});