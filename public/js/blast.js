/*globals console io $ document */

$(document).ready( function(){

	var basepath = $("blast-form").data("basepath");

	var socket = io.connect( { path: basepath + "/socket.io" } );
	socket.on('output', function(message) {
		$("#blast-data").append( message );
	});

	$.get( basepath + "/api/db", function( data ) {

		if ( data ) {
			if ( data.nucl ) {
				for ( var k in data.nucl ) {
					if ( data.nucl[k] ) {
						$("#nucl").append("<option>" + k + "</option>" );
					}
				}
			}
			if ( data.prot ) {
				for ( var k in data.prot ) {
					if ( data.prot[k] ) {
						$("#prot").append("<option>" + k + "</option>" );
					}
				}
			}
		}
	});

	// Getting organisms
	$("[name=organism]").append("<option value='0'>" + "All" + "</option>" );
	$.get( basepath + "/api/species", function( data ) {
		if ( data ) {
			if (data instanceof Array) {
				for ( var k in data ) {
					if ( data[k] ) {
						$("[name=organism]").append("<option value="+data[k].id+">" + data[k]["scientific_name"] + "</option>" );
					}
				}
			} else {
				$("[name=organism]").append("<option value="+data.id+">" + data["scientific_name"] + "</option>" );
			}
		}
	});

});

$( "[name=moltype]" ).change(function() {

	var valid = "#" + $(this).val();
	$( ".dbselect" ).hide();
	$( valid ).show();

});

$(function() {
	$('#blast-exec').click(function() {

		var exec = $(this).attr("data-blast-exec");
		var binary = null;
		var db = null;
		var format = "html";
		var organism = 0;

		if ( $( "[name=moltype]" ).val() === 'nucl' ) {
			binary = "blastn";
			db = $( "[name=nucllist]" ).val();
		} else {
			binary = "blastp";
			db = $( "[name=protlist]" ).val();
		}
		
		organism = parseInt( $( "[name=organism]" ).val(), 10 );

		$("#blast-data").empty();
		$.post( exec, { seq: $('textarea').val(), binary: binary, db: db, format: format, organism: organism });
	});
});

// Detect details
$( document ).on( "click", ".hit > .details", function() {

	var hsps = $(this).parent().children(".hsps").get(0);

	$(hsps).fadeToggle('fast');

});

// Detect hit appears
$(document).on('DOMNodeInserted', function(e) {

	if ( $(e.target).hasClass("hit") ) {
		
		var idelem = $(e.target).children(".id").get(0);
		var id = $(idelem).text();
		// TODO: Link here to Database or system
	}
});

// Mutation observer on results 
// TODO: Fallback Mutation Events
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var list = document.querySelector('#blast-data');

var observer = new MutationObserver(function(mutations) {  
	mutations.forEach(function(mutation) {
		if (mutation.type === 'childList') {
			console.log("tal!");
		}
	});
});
  
observer.observe(list, {
	attributes: true, 
	childList: true, 
	characterData: true,
	subtree: true
});


