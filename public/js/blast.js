/*globals console io $ document */

$(document).ready( function(){

	var basepath = $("#blast-form").data("basepath");

	var socket = io.connect( { path: basepath + "/socket.io" } );
	socket.on('blast', function(message) {
		if ( $("#blast-data").find(".results").length === 0 ) { // If nothing append output
			// TODO: Handle continuous output
			$("#blast-data").empty();
			if ( $("#blast-data").children(".align-button").length === 0 ) {
				$("#blast-data").append("<div class='align-button'><button id='align-exec'>Align</button></div>");
			}
			$("#blast-data").append( printBLAST( message ) );
		} else {
			console.log( "Huis" );
		}
	});

	$.get( basepath + "/db", function( data ) {

		if ( data ) {
			if ( data.nucl ) {
				$("#nucl").empty();
				for ( var k in data.nucl ) {
					if ( data.nucl[k] ) {
						$("#nucl").append("<option>" + k + "</option>" );
					}
				}
			}
			if ( data.prot ) {
				$("#prot").empty();
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
	$.get( basepath + "/species", function( data ) {
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

		var basepath = $("#blast-form").data("basepath");
		$("#blast-data").empty();

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
//var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
//var list = document.querySelector('#blast-data');
//
//var observer = new MutationObserver(function(mutations) {  
//	mutations.forEach(function(mutation) {
//		if (mutation.type === 'childList') {
//			// console.log("tal!");
//		}
//	});
//});
//  
//observer.observe(list, {
//	attributes: true, 
//	childList: true, 
//	characterData: true,
//	subtree: true
//});


function printBLAST( object ) {

	var obj = JSON.parse( object );

	var blastobj = obj["BlastOutput2"]["report"];

	var expect = blastobj.params.expect;
	var gopen = blastobj.params.gap_open;
	var gextend = blastobj.params.gap_extend;

	var program = blastobj.program;
	var str = "";

	if ( program === 'psiblast' && blastobj.results.iterations ) {
		
		var iterationlist = blastobj.results.iterations;
		for ( var iter = 0; iter < iterationlist.length; iter = iter + 1 ) {
			
			str = str + "<div class='iter'>";
			str = str + "<span class='id'>" + iterationlist[iter].iter_num + "</span>";
			str = str + "<div class='results'>";
			str = str + processHits( iterationlist[iter].search.hits );
			str = str + "</div>";
			str = str + "</div>";
		}

	} else {
		str = str + "<div class='results'>";
		str = str + processHits( blastobj.results.search.hits );
		str = str + "</div>";
	}

	if ( str === "" ) {
		str = "<p class='not-found'>No hits found.</p>";
	}
    
	return str;

}

function processHits( hits ) {

	var str = "";

	for ( var hit = 0; hit < hits.length; hit = hit + 1 ) {
		
		str = str + "<div class='hit'><input type='checkbox' class='hitcheck' />";
		str = str + "<span class='id'>" + hits[hit].description[0].id + "</span>"; // Assume first desc

		if ( hits[hit].description[0].taxid ) {
			str = str + "<span class='taxid'>" + hits[hit].description[0].taxid + "</span>";
		}

		str = str + "<span class='evalue'>" + hits[hit].hsps[0].evalue + "</span>"; // Higher value
		str = str + "<span class='details'>Details...</span>"; // Details
		str = str + "<div class='hsps'>" + processHsps( hits[hit].hsps ) + "</div>";
		str = str + "</div>"
	}

	return str;
}

function processHsps( hsps ) {

	var content = "";

	for ( var iter = 0; iter < hsps.length; iter = iter + 1 ) {
		var qseq = hsps[iter].qseq;
		var midline = hsps[iter].midline;
		var hseq = hsps[iter].hseq;
		var bit_score = hsps[iter].bit_score;
		var score = hsps[iter].score;
		var evalue = hsps[iter].evalue;
		var qstart = hsps[iter].query_from;
		var qend = hsps[iter].query_to;
		var hstart = hsps[iter].hit_from;
		var hend = hsps[iter].hit_to;
		var query_frame = hsps[iter].query_frame;
		var hit_frame = hsps[iter].hit_frame;
		var identity = hsps[iter].identity;
		var positive = hsps[iter].positive;
		var gaps = hsps[iter].gaps;
		var length = hsps[iter].align_len;

		var arrSeqs = {};
		arrSeqs = splitSeq( arrSeqs, qseq, midline, hseq, 60 );

		content+="<div class='hsp'>";
		content+="<div class='stats'><span class='field'>evalue:</span><span class='value'>"+evalue+"</span><span class='field'>bit score:</span><span class='value'>"+bit_score+"</span><span class='field'>score:</span><span class='value'>"+score+"</span>";
		content+="<span class='field'>identity:</span><span class='value'>"+identity+"</span><span class='field'>positive:</span><span class='value'>"+positive+"</span><span class='field'>gaps:</span><span class='value'>"+gaps+"</span></div>";
		content+="<div class='block'>";

		content+= printBlock( arrSeqs, query_frame, hit_frame, qstart, qend, hstart, hend, 60 );

		content+="</div>";

		content+="</div>";
	}

	return content;
}

function printBlock( arrSeqs, query_frame, hit_frame, qstart, qend, hstart, hend, num ){

	var content = "";

	var count = 0
	for ( var qst = 0; qst < arrSeqs["qseq"].length; ++qst ) {

		var start1 = qstart + (count*num);
		var start2 = hstart + (count*num);

		var end1 = qend;
		var end2 = hend;
		if ( qend > ( parseInt( start1 ) + num ) ) {
			end1 = parseInt( start1 ) + num - 1;
		}
		if ( hend > ( parseInt( start2 ) + num ) ) {
			end2 = parseInt( start2 ) + num - 1;
		}

		content+="<div class='align'>";

		var content_query_frame = "";
		var content_hit_frame = "";
		if ( query_frame ) {
			content_query_frame = query_frame;
		}
		if ( hit_frame ) {
			content_hit_frame = hit_frame;
		}

		content+="<div class='seq seq-query'><span class='frame'>"+content_query_frame+"</span><span class='start'>"+start1+"</span><p class='actual'>"+arrSeqs["qseq"][qst]+"</p><span class='end'>"+end1+"</span></div>";
		content+="<div class='seq mid'><span class='frame'></span><span class='start'></span><p class='actual'>"+arrSeqs["midline"][qst]+"</p><span class='end'></span></div>";
		content+="<div class='seq seq-hit'><span class='frame'>"+content_hit_frame+"</span><span class='start'>"+start2+"</span><p class='actual'>"+arrSeqs["hseq"][qst]+"</p><span class='end'>"+end2+"</span></div>";
		content+="</div>";

		count = count + 1;
	}

	return content;

}

function splitSeq( arrSeqs, qseq, midline, hseq, num ) {


	arrSeqs.qseq = [];
	arrSeqs.midline = [];
	arrSeqs.hseq = [];

	if ( qseq.length === midline.length && midline.length === hseq.length ) {
		var qarr = qseq.split("");
		var marr = midline.split("");
		var harr = hseq.split("");

		var iter = 0;
		var count = 0;

		var qstr = "";
		var hstr = "";
		var mstr = "";

		for ( var chars = 0; chars < qarr.length; ++chars ) {

			qstr = qstr + qarr[ chars ];
			hstr = hstr + harr[ chars ];
			mstr = mstr + marr[ chars ];

			if (count === num - 2 ) {
				arrSeqs["qseq"].push( qstr );
				arrSeqs["midline"].push( mstr );
				arrSeqs["hseq"].push( hstr );

				qstr = "";
				hstr = "";
				mstr = "";

				count = -1;
			}

			count = count + 1;
		}

		arrSeqs["qseq"].push( qstr );
		arrSeqs["midline"].push( mstr );
		arrSeqs["hseq"].push( hstr );

	}

	return arrSeqs;
}

