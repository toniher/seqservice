/*globals console io $ document */

$(function() {
	$('#align-exec').click(function() {

		var exec = $(this).attr("data-align-exec");
		var seqs = [];

		$("#blast-data .hitcheck").each( function( i ) {

			// Retrieve ID

			// Retrieve Seq

		});

		var align = {};
		align.app = "muscle"; // For now only
		align.params = "";

		var tree = {};
		tree.app = "phyml"; // For now only
		tree.params = "";

		var params = { seqs: seqs, align: align, tree: tree };

		$("#align-data").empty();
		$.post( params );
	});
});