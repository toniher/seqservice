/*globals console io $ document */

console.log("Align loaded");

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
		align.params = ""; // String params for now

		var tree = {};
		tree.app = "phyml"; // For now only
		tree.params = ""; // String params for now

		var params = { seqs: seqs, align: align, tree: tree };

		var exec = "/seqservice/align"; // TODO: to change and get base

		$("#align-data").empty();
		console.log( params );
		$.post( exec, params );
	});
});