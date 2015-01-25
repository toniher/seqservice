/*global io, console, location $ */

var socket = io.connect(); // TODO: Check this!
socket.on('output', function(message) { console.log('output: ', message); $("#blast-data").append( message ); });

$( "[name=moltype]" ).change(function() {
	var valid = "#" + $(this).val();
	$( ".dbselect" ).hide();
	$( valid ).show();

});

$(function() {
	$("button").click(function() {
		var exec = $(this).attr("data-blast-exec");
		var binary = null;
		var db = null;

		if ( $( "[name=moltype]" ).val() === 'nucl' ) {
			binary = "blastn";
			db = $( "[name=nucllist]" ).val();
		} else {
			binary = "blastp";
			db = $( "[name=protlist]" ).val();
		}
		
		$.post( exec, { seq: $('textarea').val(), binary: binary, db: db });
	});
});