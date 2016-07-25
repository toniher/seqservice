/*globals console io $ document */

$(document).ready( function(){

	var basepath = $("body").data("basepath");
	var socketio = $("body").data("socketio");
	var taxonidurl = $("#blast-form").data("external-taxonid");

	if ( socketio ) {
		var socket = io.connect( { path: basepath + "/socket.io" } );
		socket.on('blast', function(message) {
			prepareHTMLBLAST( message );
			if ( taxonidurl ) {
				addTaxonIDinBlast( taxonidurl );
			}
		});
	}

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
	

	// If upload form
	
	//new PouchDB('reports').destroy().then(function () {
	//  // database destroyed
	//}).catch(function (err) {
	//  // error occurred
	//})

	panelListing();

});

$( "[name=moltype]" ).change(function() {

	var valid = "#" + $(this).val();
	var method = "#blast-" + $(this).val();
	$( ".dbselect" ).hide();
	$( ".methodselect" ).hide();

	/** TODO: Not satisfying change **/
	$( valid ).show();
	$( method ).css("display", "inline-block");

});

$(".psicheck").on( "click", function() {
	
	if ( $(this).is(':checked') ) {
		$(".psiiter").show();
	} else {
		$(".psiiter").hide();
	}
	
});

$(function() {
	$('#blast-exec').on( 'click', function() {

		var exec = $(this).data("exec");

		var basepath = $("body").data("basepath");
		var socketio = $("body").data("socketio");
		var taxonidurl = $("#blast-form").data("external-taxonid");

		// More generic seqinput
		var seqinput = "";
		if ( $("#seqinput").is("textarea") || $("#seqinput").is("input") ) {
			seqinput = $("#seqinput").val().trim();
		} else {
			seqinput = $("#seqinput").text().trim();
		}
		
		$("#blast-data").empty();

		var binary = null;
		var db = null;
		var organism = 0;
		var moltype = $( "[name=moltype]" ).val();

		if ( moltype === 'nucl' ) {
			binary = "blastn";

			if ( $( "[name=blast-nucl]" ).length > 0 ) {
				binary = $( "[name=blast-nucl]:checked" ).val();
			}

			db = $( "[name=nucllist]" ).val();
		} else {
			
			moltype = "prot";
			
			binary = "blastp";

			if ( $( "[name=blast-prot]" ).length > 0 ) {
				binary = $( "[name=blast-prot]:checked" ).val();
			}

			db = $( "[name=protlist]" ).val();
		}
		
		organism = parseInt( $( "[name=organism]" ).val(), 10 );

		$.post( exec, { seq: seqinput, binary: binary, db: db, dbtype: moltype, organism: organism }).done( function( data ) {

			if ( ! socketio ){
				prepareHTMLBLAST( JSON.stringify( data ) );
				if ( taxonidurl ) {
					addTaxonIDinBlast( taxonidurl );
				}
			}

		});
	});
});


$(document).on('click', "#blast-switch", function() {
	$("#blast-data").toggle();
});

// Detect details
$( document ).on( "click", ".hit > .details", function() {

	var hsps = $(this).parent().children(".hsps").get(0);

	$(hsps).fadeToggle('fast');
	
	// fuzzdetails
	var fuzz = $(this).parent().children(".fuzdetails");

	if ( fuzz.length > 0 ) {

		$(fuzz.get(0)).fadeToggle('fast');
	}
	

});

$(document).on('click', "#panelBlast #cleanDocs", function() {

	new PouchDB('reports').destroy().then(function () {
		// database destroyed
		// Clean panel
		$( "#panel" ).empty();
		$( "#panel" ).hide();

	}).catch(function (err) {
		// error occurred
	});
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

$(document).on('click', ".down-hit-seqs", function() {

	var basepath = $("body").data("basepath");

	var parent = $(this).parent().parent();

	var hitcheck = $(parent).find("input.hitcheck").filter(":checked");

	var listId = [];

	async.eachSeries(hitcheck, function(item, callback) {
		
		var hit = $(item).parent().children(".id").text();
		var hitId = processHitId( hit );

		listId.push( hitId );
		callback();
	}, function(err){
		if ( err ) {
			console.log("error retrieving seq");
		}

		// TODO: Send to service

		// Prepare params
		params = {}
		params.entry = listId;
		params.dbtype = $("[name=moltype]").val(); // TODO: To be changed
		
		params.db = null;

		if ( params.dbtype ) {
			params.db = $("#"+params.dbtype).val();
		}

		params.fmt = 2;

		console.log( params );

		$.ajax({
			url: basepath+"/db",
			cache: false,
			contentType: false,
			processData: false,
			data: params,                         
			type: 'post',
			success: function(response){
	
				console.log( response );
			}
		 });

		console.log( listId );
	});

});

function processHitId( str ) {

	if ( str.indexOf("|") > 0 ) {
		// Process |

		var parts = str.split("|");

		// Let's take the first
		return parts[1];

	} else {
		return str;
	}
}


function prepareHTMLBLAST( response ) {

	if ( $("#blast-data").find(".results").length === 0 ) { // If nothing append output
		// TODO: Handle continuous output
		$("#blast-data").empty();
		//if ( $("#blast-form").find(".align-button").length === 0 ) {
		//	$("#blast-exec").after("<div class='align-button'><button id='align-exec'>Align</button></div>");
		//}
		
		//if ( $("#blast-form").find(".switch-button").length === 0 ) {
		//	$("#blast-exec").after("<div class='switch-button'><button id='blast-switch'>Show/hide</button></div>");
		//}
		
		if ( response ) {

			printBLASTall( response, 1, function( txt, extra ) {
				// console.log( extra );

				$("#blast-data").append( txt );
				panelListing();
				
			});
		}
	}
}

function addDOMdata( selector, id, val ) {

	$(selector).data( id, val );

}

function printBLASTall( message, parse, target ) {
	
	var obj;
	if ( parse ) {
		obj = JSON.parse( message );
	} else {
		obj = message;
	}
	
	var extra = {};
	
	pouchdb_report( "reports", obj, function( db, obj, err ) {

		if ( ! err ) {
			
			if ( obj._id ) {
				// Set data
				addDOMdata( "#blast-data", "id", obj._id );
			}
	
			if ( obj.hasOwnProperty("data") ) {
		
				// All objects should have data part
				
				if ( obj["data"].hasOwnProperty("BlastOutput2") ) {
					
					blastObj = obj["data"]["BlastOutput2"];
									
					if ( blastObj instanceof Array ) {
						
						// Move async
						var iter = 0;
						var str = "";

						async.eachSeries(blastObj, function(blastIter, callback) {
							
							str = str + printBLAST( blastIter, iter );
							iter = iter + 1;
							callback();
						}, function(err){
							if ( err ) {
								console.log("error printing blast");
							}
							extra.iter = iter;
							
							target( str, extra );
						});
						
						
					} else {
						str = printBLAST( blastObj, 0 );
						target( str );
					}
				}
		
			}
	
		}
	});

}


function printBLAST( obj, num, reorder ) {

	var seq = obj['seq'];
	var id = obj['id'];
	var name = obj['name'];
	//console.log( obj );
	var blastobj = obj["report"];

	var expect = blastobj.params.expect;
	var gopen = blastobj.params.gap_open;
	var gextend = blastobj.params.gap_extend;
	
	// Process reorder
	var reord = null;
	
	if ( reorder ) {

		if ( typeof reorder[num] !== 'undefined' ) {
			reord = reorder[num];
		}
	}
	

	var program = blastobj.program;
	var head_str = "<div class='blast' id='blast-"+num+"' data-program='"+program+"' data-seq='"+seq+"' data-id='"+id+"' data-name='"+name+"'>";
	var action_str = "<div class='blast-action'><button class='btn down-hit-seqs'>Download hit sequences</button></div>";
	var str = "";
	
	// Considering reorders
	var reordHits = null;
	
	if ( program === 'psiblast' && blastobj.results.iterations ) {
		
		var iterationlist = blastobj.results.iterations;
		for ( var iter = 0; iter < iterationlist.length; iter = iter + 1 ) {
			
			if ( reord ) {
			
				if ( reord.iterations && typeof reord.iterations[iter] !== 'undefined' && reord.iterations[iter].hits ) {
					reordHits = reord.iterations[iter].hits;
				}
		
			}
			
			str = str + "<div class='iter' data-iter='"+iterationlist[iter].iter_num+"'>";
			str = str + "<span class='id'>" + iterationlist[iter].iter_num + "</span>";
			
			if ( iterationlist[iter].search && iterationlist[iter].search.hits && iterationlist[iter].search.hits.length > 0 ) {
			
				str = str + "<div class='results'>";
				str = str + processHits( iterationlist[iter].search.hits, reordHits );
				str = str + "</div>";
			} else {
				str = "<p class='not-found'>No hits found.</p>";
			}
			
			str = str + "</div>";
		}

	} else {
		
		if ( reord ) {
			
			if ( reord.iterations && typeof reord.iterations[0] !== 'undefined' && reord.iterations[0].hits ) {
				reordHits = reord.iterations[0].hits;
			}
		
		}
		
		if ( blastobj.results && blastobj.results.search && blastobj.results.search.hits, blastobj.results.search.hits.length > 0 ) {
			str = str + "<div class='results'>";
			str = str + processHits( blastobj.results.search.hits, reordHits );
			str = str + "</div>";		
		} else {
			str = "<p class='not-found'>No hits found.</p>";
		}

	}
    
	str = head_str + action_str + str + "</div>";
		
	return str;

}

function processHits( hits, reordList ) {
	
	var str = "";
	
	for ( var hit = 0; hit < hits.length; hit = hit + 1 ) {
		
		var reordInfo = null;
		
		if ( reordList && reordList[ hit ] ) {
			reordInfo = getReorderInfo( reordList[ hit ] );
		}
		
		var num = hit + 1;
				
		str = str + "<div data-num="+num;
		
		var classStr = "hit";
		// New position
		if ( reordInfo && reordInfo.hasOwnProperty("new") ) {
			
			var newNum =  reordInfo["new"];
			
			str = str + " data-new=" + newNum;
						
			if ( parseInt( newNum)  < parseInt( num ) ) {
				classStr = classStr + " fuzUp";
			} else {
				if ( parseInt( num ) < parseInt( newNum ) ) {
					classStr = classStr + " fuzDown";
				}
			}
						
		}
		
		str = str + " class='"+classStr+"'";
				
		str = str + "><input type='checkbox' class='hitcheck' />";
		str = str + "<span class='id'>" + hits[hit].description[0].id + "</span>"; // Assume first desc

		if ( hits[hit].description[0].taxid ) {
			str = str + "<span class='taxid'>" + hits[hit].description[0].taxid + "</span>";
		}

		str = str + "<span class='evalue'>" + hits[hit].hsps[0].evalue + "</span>"; // Higher value
		
		
		if ( reordInfo  && reordInfo.hasOwnProperty("new") ) {
			str = str + "<span class='fuzzy'>"+reordInfo.Fuz+"</span>";

		}
		
		str = str + "<span class='details'>Details...</span>"; // Details
		
		if ( reordInfo  && reordInfo.hasOwnProperty("new") ) {

			str = str + "<div class='fuzdetails'>";
			str = str + "<span class='fuzzy'>"+reordInfo.Dis+"</span>"
			str = str + "<span class='fuzzy'>"+reordInfo.Flx+"</span>"
			str = str + "<span class='fuzzy'>"+reordInfo.KD+"</span>"
			str = str + "</div>";
		}
		
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

function addTaxonIDinBlast( url ) {
	
	var listTaxonID = [];
	
	// retrieve IDs
	$(".results .hit .taxid").each( function( i ) {
		
		var placeholder = this;
		
		var taxonid = $(placeholder).text();
		
		listTaxonID.push( taxonid );
		
	});
	
	var listTaxonIDu = [];
	$.each( listTaxonID, function(i, el){
		if($.inArray(el, listTaxonIDu) === -1) listTaxonIDu.push(el);
	});
	
	var mapTaxonID = {};
	var counter = listTaxonIDu.length;
		
	// Retrieve from API names //TODO: Make async
	$.each( listTaxonIDu, function(i, taxonid){

		var queryurl = url + taxonid;
		
		$.ajax({
			type: 'GET',
			 url: queryurl,
			 async: false,
			 jsonp: 'callback',
			 dataType: 'jsonp',
			 success: function( data ) {
				if ( data["scientific_name"] ) {
					mapTaxonID[ taxonid ] = data["scientific_name"]
				}
				counter = counter - 1;
				if ( counter == 0 ) fillTaxonNames( mapTaxonID );
			 }
		});
		
	});
	
}

function fillTaxonNames( mapTaxonID ) {
	
	// Fill content
	$(".results .hit .taxid").each( function( i ) {
		
		var placeholder = this;
		
		var taxonid = $(placeholder).text();
		
		if ( mapTaxonID[taxonid] ) {
			$(placeholder).after("<span class='taxname'>"+mapTaxonID[taxonid]+"</span>");

		}
		
	});
	
}

function getReorderInfo( info ) {
	
	var hash = {};
	
	if ( info ) {
		hash = info;
	}
	
	return hash;

}

function panelListing( ) {
	
	if ( $('#panel').length > 0 ) {

		pouchdb_listdocs( "reports", "typeindex", "blast", function( data ){
			// console.log( data );
			if ( data && data.total_rows > 0 ) {
				if ( data.rows ) {
					var str = "<div id='panelBlast'><a id='cleanDocs' href='#'>Clean History</a></div>";
					str = str + "<h5>BLAST</h5>";
					str = str + "<ul id='storedBlast' class='list-inline'>";
					for ( var r = 0; r < data.rows.length; r = r + 1 ) {
						var entry = data.rows[r];
						str = str + "<li><a class='storedDoc' data-id='"+entry.value[0]+"' href='#'>"+entry.value[1]+"</a></li>";
					}
					str = str + "</ul>";
					$( "#panel" ).empty();
					$( "#panel" ).append( str );
					$( "#panel" ).show();
				}
			}
		});
	}
}

$(function() {

	$('#uploadform').on('click', "input[type=submit]", function( e ) {
	
		e.preventDefault();
	
		var fd = new FormData();
		fd.append( 'report', $( "input[name=report]" )[0].files[0] );
	
		var basepath = $("body").data("basepath");

		$.ajax({
			url: basepath+"/load",
			dataType: 'text',
			cache: false,
			contentType: false,
			processData: false,
			data: fd,                         
			type: 'post',
			success: function(response){
	
				if ( response ) {
	
					if ( response.hasOwnProperty("data") ) {
	
						var data = response.data;
						if ( data.hasOwnProperty("seq") ) {
							$("#seqinput").val( data.seq );
						}
	
						printBLASTall( response, 1, function( txt, extra ) {
							// console.log( extra );
		
							$("#blast-data").empty();
							$("#blast-data").append( txt );
							panelListing();
						});
					}
				}
			}
		 });
	});
	
	$("#panel").on('click', "#storedBlast .storedDoc", function( e ) {
	
		e.preventDefault();
		var docId = $(this).data( "id" );
	
		if ( docId ) {
			pouchdb_retrieve( "reports", docId, function( err, response ) {
				if ( ! err ) {
	
					if ( response ) {
	
						if ( response.hasOwnProperty("data") ) {
	
							var data = response.data;
							if ( data.hasOwnProperty("seq") ) {
								$("#seqinput").val( data.seq );
							}
	
							printBLASTall( response, null, function( txt, extra ) {
								// console.log( extra );
			
								$("#blast-data").empty();
								$("#blast-data").append( txt ); 
							});
						}
					}
				}
			});
		}
	
	});
	
	// Detect changes on textarea
	var oldVal = "";
	$("#seqinput").on("change keyup paste", function() {
		var currentVal = $(this).val();
		if(currentVal == oldVal) {
			return; //check to prevent multiple simultaneous triggers
		}
	
		oldVal = currentVal;
		//action to be performed on textarea changed
		// TODO: Detect if Protein or Nucleic Acid
		
		detectMolType( currentVal, function( type ) {
			
			if ( type === 'prot' ) {
				console.log("PROT entry");
				// TODO: enable prot stuff
			}
			
		});
		
	});
	
	function detectMolType( val, cb ) {
		
		val = val.replace(/\s/g,'');
		if ( /[WQERYIPSDFHKLVM]/.test(val.toUpperCase()) ) {
			cb("prot")
		} else {
			cb( null );
		}
	}

});
