/*globals console io $ document */
var $ = require('jquery');
var jQuery = require('jquery');
var async = require('async');
require('bootstrap');
import {pouchdbInterface} from './pouchdb.js';


var reportProcess = {}; // Object storing processing of reports

$(document).ready( function(){

	var basepath = $("body").data("basepath");
	var socketio = $("body").data("socketio");

	if ( socketio ) {
		var socket = io.connect( { path: basepath + "/socket.io" } );
		socket.on('blast', function(message) {
			prepareHTMLBLAST( message );
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
	//$("[name=organism]").append("<option value='0'>" + "All" + "</option>" );
	//$.get( basepath + "/species", function( data ) {
	//	if ( data ) {
	//		if (data instanceof Array) {
	//			for ( var k in data ) {
	//				if ( data[k] ) {
	//					$("[name=organism]").append("<option value="+data[k].id+">" + data[k]["scientific_name"] + "</option>" );
	//				}
	//			}
	//		} else {
	//			$("[name=organism]").append("<option value="+data.id+">" + data["scientific_name"] + "</option>" );
	//		}
	//	}
	//});
	

	// If upload form
	
	//new PouchDB('reports').destroy().then(function () {
	//  // database destroyed
	//}).catch(function (err) {
	//  // error occurred
	//})


	panelListing();

});

$(function() {

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
	
	// Ensure remote no blast
	$(".remotecheck").on( "click", function() {
		
		if ( $(this).is(':checked') ) {
			$(".psiiter").hide();
			$(".psicheck").attr('checked', false );
		}
		
	});


	$('.prog-exec').on( 'click', function() {

		// Remove selected
		$( ".stored-container .storedDoc" ).removeClass( "selected" );
	
		var exec = $(this).data("exec");

		var basepath = $("body").data("basepath");
		var socketio = $("body").data("socketio");

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
		var psicheck = false;
		var psiiter = null;
		var remotecheck = false;
		var evaluecheck = null;
		var maxhitsnum = null;

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

		// Extra params
		
		if ( $( "[name=psicheck]" ).length > 0 ) {
			if ( $( "[name=psicheck]" ).is(':checked') ) {
				psicheck = true;
			}
		}
		if ( $( "[name=psiiter]" ).length > 0 ) {
			psiiter = $( "[name=psiiter]" ).val();
		}
		if ( $( "[name=remotecheck]" ).length > 0 ) {
			if ( $( "[name=remotecheck]" ).is(':checked') ) {
				remotecheck = true;
			}
		}
		if ( $( "[name=evaluecheck]" ).length > 0 ) {
			evaluecheck = $( "[name=evaluecheck]" ).val();
		}
		if ( $( "[name=maxhitsnum]" ).length > 0 ) {
			maxhitsnum = $( "[name=maxhitsnum]" ).val();
		}

		var params = {
						seq: seqinput,
						binary: binary,
						db: db,
						dbtype: moltype,
						organism: organism,
						psicheck: psicheck,
						psiiter: psiiter,
						remotecheck: remotecheck,
						evalue: evaluecheck,
						max_target_seqs: maxhitsnum
					};
		
		// Send first request
		var reqexec = basepath + "/request" ;
		var reqparams = params;
		
		$.post( reqexec, reqparams ).done( function( request ) {
			
			if ( request && request._id ) {
				
				params.refid = request._id;
				request.type = "submit";

				// TODO: we should make next steps dependent on this
				pouchdbInterface.report( "reports", request, function( db, request, err ) {}  );
				
				$.post( exec, params ).done( function( data ) {
		
					if ( ! socketio ){
						prepareHTMLBLAST( JSON.stringify( data ) );
					}
		
				});
				
			} else {
				
				// TODO: Handle problem
				console.log( "problem!" );
			}
	
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
	
	$(document).on('click', ".hitcheck", function() {
		// Clean form when choosing more stuff
		$("#down-form").empty();
		
	});
	

	$(document).on('click', ".panel-container .downDoc", function() {
	
		var link = this;
		var docId = $(".stored-container .selected").first().data("id");
		var name = $(".stored-container .selected").first().text();
		var filename = name + ".json";
		
		if ( docId ) {
				
			pouchdbInterface.retrieve( "reports", docId, function( error, data ){
	
				if ( ! error ) {
					
					// Let's force download
					var file = new File([ JSON.stringify(data) ], {type: "text/json;charset=utf-8"});
					saveAs(file, filename, true); // True is for removing bom https://github.com/eligrey/FileSaver.js/issues/160
				}
				
			});
		}

	});
	
	$(document).on('click', ".panel-container .rmDoc", function() {
	
		var docId = $(".stored-container .selected").first().data("id");
		
		if ( docId ) {
			pouchdbInterface.rm( "reports", docId, function( data ){
	
				// Refresh panel
				panelListing();
				$("#blast-data").empty();
				
			});
			
		}

	});

	$(document).on('click', ".panel-container .cleanDocs", function() {
	
		pouchdbInterface.destroy( "reports", function( data ){
			// Clean panel
			$( "#panel" ).empty();
			$( "#panel" ).hide();
		});
	});
	
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
			let params = {};
			params.entry = listId;
			params.dbtype = $("[name=moltype]").val(); // TODO: To be changed
			
			params.db = null;
	
			if ( params.dbtype ) {
				params.db = $("#"+params.dbtype).val();
			}
	
			params.fmt = 2;
	
			// console.log( params );
	
			$.ajax({
				url: basepath+"/db",
				cache: false,
				contentType : 'application/json',
				processData: false,
				data: JSON.stringify( params ),                         
				type: 'POST',
				success: function(response){
	
					if ( response && response.download ) {
						$("#down-form").empty();
	
						if ( response.path ) { $("#down-form").append("<input name='path' type='hidden' value='"+response.path+"' />"); }
						if ( response.filename ) { $("#down-form").append("<input name='filename' type='hidden' value='"+response.filename+".fasta' />"); }
						$("#down-form").append("<input id='down-button' class='btn btn-primary' type='submit' value='Download' />");
	
						$("#down-form").submit( function( event ) { } );
					}
				}
			 });
	
			// console.log( listId );
		});
	
	});
	
	// Access genome browser
	$(document).on('click', ".go-genome-browser", function() {
	
		var hitBlock = $(this).parents(".hit").first();
		
		var hit = $(hitBlock).children(".id").text();
		var hitId = processHitId( hit );
		
		
		var hsps = $(hitBlock).find(".hsps .hsp");
		if ( hsps.legnth > 0 ) {
			var mainHsp = $(hsps).first();
			
			var start = $(mainHsp).data("hstart");
			var end = $(mainHsp).data("hend");
	
			// TODO: Continue query
			
		}
		
	});
	
	// Change for adapting hmmer
	
	$( document ).on('change', '[name=blast-prot]', function() {
		
		let val = $("[name=blast-prot]:checked").val();
				
		if ( val === 'phmmer' ) {
			changeDOMphmmer();
		} else {
			changeDOMblast();
		}
		
	});
	
	function changeDOMphmmer() {
		$("#blast-exec").hide();
		$("#hmmer-exec").show();
		$("#blast-params-extra").hide();
	}
	
	function changeDOMblast() {
		$("#blast-exec").show();
		$("#hmmer-exec").hide();
		$("#blast-params-extra").show();

	}
	
});



function processHitId( str ) {

	if ( str.indexOf("|") > 0 ) {
		// Process |

		var parts = str.split("|");

		// Hack here, let's assume only if sp, gi, ref or so...
		if ( parts[0].length < 4 ) {
			// Let's take the first
			return parts[1];
		} else {
			return str;
		}

	} else {
		return str;
	}
}


function prepareHTMLBLAST( response ) {

	if ( $("#blast-data").find(".results").length === 0 ) { // If nothing append output
		// TODO: Handle continuous output
		$("#blast-data").empty();
		$("#go-data").empty();
		
		//if ( $("#blast-form").find(".switch-button").length === 0 ) {
		//	$("#blast-exec").after("<div class='switch-button'><button id='blast-switch'>Show/hide</button></div>");
		//}
		
		if ( response ) {

			printBLASTall( response, 1, function( txt, extra ) {
				// console.log( extra );

				$("#blast-data").append( txt );
				var taxonidurl = $("#blast-form").data("external-taxonid");
				addTaxonIDinBlast( taxonidurl );
				panelListing();
				
			});
		}
	}
}

function addDOMdata( selector, id, val ) {
	
	$(selector).attr( "data-"+id, val );

}

function printBLASTall( message, parse, target ) {
	
	var obj;
	if ( parse ) {
		if ( isJson( message ) ){
			obj = JSON.parse( message );
		} else {
			obj = message;
		}
	} else {
		obj = message;
	}
	
	var extra = {};
	var params = {};
	
	pouchdbInterface.report( "reports", obj, function( db, obj, err ) {

		if ( ! err ) {
			
			if ( obj._id ) {
				addDOMdata( "#blast-data", "id", obj._id );
			}

			if ( obj.hasOwnProperty("data") ) {
		
				// All objects should have data part
				var data = obj.data;

				if ( data.params ) {
					if ( data['params'].binary ) {
						addDOMdata( "#blast-data", "binary", data['params'].binary );
						params.binary = data['params'].binary;
					}
					if ( data['params'].db ) {
						addDOMdata( "#blast-data", "db", data['params'].db );
						params.db = data['params'].db;
					}
					if ( data['params'].dbtype ) {
						addDOMdata( "#blast-data", "dbtype", data['params'].dbtype );
						params.dbtype = data['params'].dbtype;
					}
				}

				if ( data.hasOwnProperty("BlastOutput2") || data.hasOwnProperty("HMMEROutput") ) {
					
					let blastObj;
					let type = "blast";
					
					if ( data.hasOwnProperty("BlastOutput2") ) {
					
						blastObj = data["BlastOutput2"];
					
					} else {
						blastObj = data["HMMEROutput"];
						type = "hmmer";
					}
									
					if ( blastObj instanceof Array ) {
						
						// Move async
						var iter = 0;
						let str = "";

						async.eachSeries(blastObj, function(blastIter, callback) {
							
							str = str + printReport( type, blastIter, iter, null, params );
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
						
						let str = "";
						
						str = printReport( type, blastObj, 0, null, params );
						target( str );
					}
				}
		
			}
	
		}
	});

}

function printReport( type, obj, num, reorder, params ) {
	
	
	if ( type === "hmmer" ) {
		return reportProcess.printBLAST( obj, num, reorder, params );
		// return null;
		//printHMMER( obj, num, reorder, params );
	} else {
		 return reportProcess.printBLAST( obj, num, reorder, params );
	}
	
}


reportProcess.printBLAST = function( obj, num, reorder, params ) {

	var seq = obj['seq'];
	var id = obj['id'];
	var name = obj['name'];
	//console.log( obj );
	var blastobj = obj["report"];

	// TODO: Check if this below needed
	// var expect = blastobj.params.expect;
	// var gopen = blastobj.params.gap_open;
	// var gextend = blastobj.params.gap_extend;
	

	// Extra params
	if ( ! params ) {
		params = {};
	}

	// Process reorder
	var reord = null;
	
	if ( reorder ) {

		if ( typeof reorder[num] !== 'undefined' ) {
			reord = reorder[num];
		}
	}
	

	var basepath = $("body").data("basepath");

	var program = blastobj.program;
	var head_str = "<div class='blast' id='blast-"+num+"' data-binary='"+program+"' data-seq='"+seq+"' data-id='"+id+"' data-name='"+name+"'>";
	
	var single_str = retrieveSingleButtons();
	
	var action_str = "<div class='blast-action'><button class='btn down-hit-seqs'>Retrieve hit sequences</button><form id='down-form' action='"+basepath+"/tmp' method='post'></form>"+single_str+"<!--<button class='btn' id='align-exec'>Continue running with selection --TODO--</button>--></div>";
		
	var select_str = "<div class='check-action'><a class='check-all' href='#'>Check all</a> | <a class='check-ten' href='#'>Check up to 10</a> | <a class='check-none' href='#'>Check none</a></div>";
	var str = "";
		
	// Get links
	var dblist = $("body").data("dblist");

	var db = params.db;
	var dbtype = params.dbtype;

	if ( db && dbtype ) {

		if ( dblist && dblist[dbtype] && dblist[dbtype][db] && dblist[dbtype][db]["links"] ) {
			params.links = dblist[dbtype][db]["links"];
		}

	}

	// Considering reorders
	var reordHits = null;
	
	if ( blastobj.results.iterations ) {

		var iterationlist = blastobj.results.iterations;
		
		if ( iterationlist.length > 0 ) {
			
			str = str + "<ul class='itertabs'>";
			for ( var iter = 1; iter < iterationlist.length + 1; iter = iter + 1 ) {
				str = str + "<li class='itertab' data-iter='"+iter+"'>"+iter+"</li>";
			}
			str = str + "</ul>";
		}
		
		
		str = str + "<div class='iterations'>";

		
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
				str = str + reportProcess.processHits( iterationlist[iter].search.hits, reordHits, params );
				str = str + "</div>";
			} else {
				str = "<p class='not-found'>No hits found.</p>";
			}
			
			str = str + "</div>";
		}
		
		str = str + "</div>";

	} else {
		
		if ( reord ) {
			
			if ( reord.iterations && typeof reord.iterations[0] !== 'undefined' && reord.iterations[0].hits ) {
				reordHits = reord.iterations[0].hits;
			}
		
		}
		
		if ( blastobj.results && blastobj.results.search && blastobj.results.search.hits && blastobj.results.search.hits.length > 0 ) {
			str = str + "<div class='results'>";
			str = str + reportProcess.processHits( blastobj.results.search.hits, reordHits, params );
			str = str + "</div>";		
		} else {
			str = "<p class='not-found'>No hits found.</p>";
		}

	}
    
	str = head_str + action_str + select_str + str + "</div>";
		
	return str;

};

reportProcess.processHits = function( hits, reordList, params ) {
	
	var str = "";
	
	for ( var hit = 0; hit < hits.length; hit = hit + 1 ) {
		
		var reordInfo = null;
		
		if ( reordList && reordList[ hit ] ) {
			reordInfo = getReorderInfo( reordList[ hit ] );
		}
		
		var num = hit + 1;

		var hitinfo = {};
						
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
		hitinfo.hitid = hits[hit].description[0].id;

		// TODO: Assing some default start - end for hit
		hitinfo.start = 0;
		hitinfo.end = 0;

		if ( hits[hit].description[0].taxid ) {
			str = str + "<span class='taxid'>" + hits[hit].description[0].taxid + "</span>";
		}

		str = str + "<span class='evalue'>" + hits[hit].hsps[0].evalue + "</span>"; // Higher value
		
		
		if ( reordInfo  && reordInfo.hasOwnProperty("new") ) {
			str = str + "<span class='fuzzy'>"+reordInfo.Fuz+"</span>";

		}

		// links
		if ( params && params.links ) {

			if ( params.links.length > 0 ) {
				for ( var link = 0; link <  params.links.length; link = link + 1 ) {
					str = str + addLinkParams( params.links[ link ], hitinfo );
				}
			}
		}
		
		str = str + "<span class='details'>Details...</span>"; // Details

		str = str + addSingleServices( );

		if ( reordInfo  && reordInfo.hasOwnProperty("new") ) {

			str = str + "<div class='fuzdetails'>";
			str = str + "<span class='fuzzy'>"+reordInfo.Dis+"</span>"
			str = str + "<span class='fuzzy'>"+reordInfo.Flx+"</span>"
			str = str + "<span class='fuzzy'>"+reordInfo.KD+"</span>"
			str = str + "</div>";
		}
		
		str = str + "<div class='hsps'>" + reportProcess.processHsps( hits[hit].hsps ) + "</div>";
		str = str + "</div>"
	}

	return str;
};

reportProcess.processHsps = function( hsps ) {

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
		arrSeqs = reportProcess.splitSeq( arrSeqs, qseq, midline, hseq, 60 );

		var dataframes = "";
		if ( query_frame ) {
			dataframes = dataframes + " data-query_frame="+query_frame;
		}
		if ( hit_frame ) {
			dataframes = dataframes + " data-hit_frame="+hit_frame;
		}

		content+="<div class='hsp' data-qstart="+qstart+" data-qend="+qend+" data-hstart="+hstart+" data-hend="+hend+dataframes+">";
		content+="<div class='stats'>";
		content+="<span class='field'>evalue:</span><span class='value' data-name='evalue'>"+evalue+"</span>";
		if ( bit_score ) {
			content+="<span class='field'>bit score:</span><span class='value' data-name='bit_score'>"+bit_score+"</span>";
		}
		if ( score ) {
			content+="<span class='field'>score:</span><span class='value' data-name='score'>"+score+"</span>";
		}
		if ( identity ) {
			content+="<span class='field'>identity:</span><span class='value' data-name='identity'>"+identity+"</span>";
		}
		if ( positive ) {
			content+="<span class='field' data-name='positive'>positive:</span><span class='value' data-name='positive'>"+positive+"</span>";
		}
		if ( gaps ) {
			content+="<span class='field'>gaps:</span><span class='value' data-name='gaps'>"+gaps+"</span></div>";
		}
		content+="<div class='block'>";

		content+= reportProcess.printBlock( arrSeqs, query_frame, hit_frame, qstart, qend, hstart, hend, 60 );

		content+="</div>";

		content+="</div>";
	}

	return content;
};

reportProcess.printBlock = function( arrSeqs, query_frame, hit_frame, qstart, qend, hstart, hend, num ){

	var content = "";

	var count = 0;
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

};

reportProcess.splitSeq = function( arrSeqs, qseq, midline, hseq, num ) {


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
};

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

	$.ajax({
			type: 'GET',
			 url: url + listTaxonIDu.join("-"),
			 async: true,
			 jsonp: 'callback',
			 dataType: 'jsonp',
			 success: function( data ) {

				if( Object.prototype.toString.call( data ) === '[object Array]' ) {
					$.each( data, function(i, el){
						mapTaxonID[ el["id"] ] = el["scientific_name"];
					});
				} else {
					if ( data["scientific_name"] ) {
						mapTaxonID[ data["id"] ] = data["scientific_name"];
					}
				}

				fillTaxonNames( mapTaxonID );
			 }
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

function retrieveSingleButtons( ){

	var str = "";

	return str;
	
}


function addSingleServices( ) {
	
	var str = "";
	
	// Add single services
	str = "<span class='single'></span>";
	
	
	return str;
	
}

function getReorderInfo( info ) {
	
	var hash = {};
	
	if ( info ) {
		hash = info;
	}
	
	return hash;

}

function addLinkParams( linkParam, info ) {

	var str = "";

	var name = "Link";

	if ( linkParam.name ) {
		name = linkParam.name;
	}

	if ( linkParam.url ) {

		var url = linkParam.url;
		var linkParamArr = [];

		if ( linkParam.params ) {

			for ( let k in linkParam.params ) {
				if ( linkParam.params.hasOwnProperty( k ) ) {
					linkParamArr.push( k+"="+linkParam.params[k] );
				}
			}
		}

		if ( linkParam.user ) {
			for ( let k in linkParam.user ) {
				if ( linkParam.user.hasOwnProperty( k ) ) {
					
					let urx = {};
					
					// Process regex of variable just in case
					if ( linkParam.urx && linkParam.urx.hasOwnProperty( k ) ) {
						urx[ k ] = linkParam.urx[k];
					}
					
					linkParamArr.push( k+"="+replaceWithInfo( linkParam.user[k], info, urx[k] ) );
				}
			}
		}

		if (linkParamArr.length > 0 ) {
			url = url + "?"+ linkParamArr.join("&");
		}

		str = "<span class='link' data-link='"+name+"'><a target='_blank' href='"+url+"'>"+name+"</a></span>";
	}

	return str;
}

function replaceWithInfo( str, hash, rx=null ) {

	for ( let h in hash ) {
		if ( hash.hasOwnProperty( h ) ) {
			
			let value = hash[h];
			
			if ( rx && rx.hasOwnProperty( h ) ) {
				
				let regex = rx[h];
				// Hack for escaping
				regex = regex.replace("\\\\", "\\");
				let re = new RegExp(regex);
				
				let found = value.match(re);
				
				if ( found && found.length > 1 ) {
					// Assuming only one match
					value = found[1];
				}
				
			}
			
			str = str.replace( h, value );
		}
	}

	return str;

}


function panelListing( ) {
	
	if ( $('#panel').length > 0 ) {
		
		let programs = ["blast", "hmmer"];
		let panelContent = "";

		async.eachSeries( programs, function( program, callback ) {


			pouchdbInterface.listdocs( "reports", "typeindex", program, function( data ){
				// console.log( data );
				if ( data && data.total_rows > 0 ) {
					if ( data.rows && data.rows.length > 0 ) {
						
						// Trigget panel show here
						$( "#panel" ).show();

						var str = "<div class='panel-container'><a class='downDoc' href='#'>Download Run (JSON)</a> | <a class='rmDoc' href='#'>Remove Run</a> | <a class='cleanDocs' href='#'>Clean All History</a></div>";
						str = str + "<h5>"+ program.toUpperCase() +"</h5>";
						str = str + "<ul class='stored-container' class='list-inline'>";
						
						// Sort values. TODO: Maybe at the DB level
						var sorted = {};
	
						for ( var r = 0; r < data.rows.length; r = r + 1 ) {
							var entry = data.rows[r];
							sorted[ entry.value[1] ] = entry.value[0];
						}
						
						var sortedKeys = Object.keys( sorted ).sort();
											
						for ( var s = 0; s < sortedKeys.length; s = s + 1 ) {
							str = str + "<li><a class='storedDoc' data-id='"+sorted[ sortedKeys[s] ]+"' href='#'>"+sortedKeys[s]+"</a></li>";
						}
						
						str = str + "</ul>";
						
						panelContent = panelContent + str;

						callback();
					} else {
						callback();
					}
				} else {
				
					callback();	
				}
			});
		
		}, function(err){
			if ( err ) {
				console.log("error printing panel");
			}
						
			$( "#panel" ).empty();
			$( "#panel" ).append( panelContent );
			
		});
	}
}

function isJson(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

$(function() {

	$('#uploadform').on('click', "input[type=submit]", function( e ) {
	
		e.preventDefault();
	
		var fd = new FormData();
		fd.append( 'report', $( "input[name=report]" )[0].files[0] );
	
		var basepath = $("body").data("basepath");

		// Send first request
		var reqexec = basepath + "/request" ;
		
		// TODO: convert something of fd into reqparams, maybe to be handled differently
		var reqparams = { "upload": true };
		
		$.post( reqexec, reqparams ).done( function( request ) {
					
			if ( request && request._id ) {
				
				let refid = request._id;
				request.type = "upload";

				// TODO: we should make next steps dependent on this
				pouchdbInterface.report( "reports", request, function( db, request, err ) {}  );
						
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
							if ( isJson( response ) ) {
								response = JSON.parse( response );
							}
							
							response.refid = refid;
		
							if ( response.hasOwnProperty("data") ) {
			
								var data = response.data;
		
								var seqinput = "";
								var seqs = recoverSequences( data );
		
								for ( var s = 0; s < seqs.length; s++ ) {
									if ( seqs[s].name ) {
											seqinput = seqinput + ">"+seqs[s].name+"\n"+seqs[s].seq+"\n";
									} else {
											seqinput = seqinput + ">Seq"+String(s)+"\n"+seqs[s].seq+"\n";
									}
								}
			
								if ( seqinput !== "" ) {
									$("#seqinput").val( seqinput );
								}
		
								printBLASTall( response, 1, function( txt, extra ) {
									// console.log( extra );
				
									$("#blast-data").empty();
									$("#blast-data").append( txt );
									var taxonidurl = $("#blast-form").data("external-taxonid");
									addTaxonIDinBlast( taxonidurl );
									panelListing();
								});
							}
						}
					}
				});
				
			} else {
				
				// TODO: Handle problem
				console.log( "problem!" );
				
			}
	
		});
		

	});
	
	$("#panel").on('click', ".storedDoc", function( e ) {
	
		e.preventDefault();
		var docId = $(this).data( "id" );
	
		$( ".stored-container .storedDoc" ).removeClass( "selected" );
		$( this ).addClass( "selected" );
	
		if ( docId ) {
			pouchdbInterface.retrieve( "reports", docId, function( err, response ) {
				if ( ! err ) {
	
					if ( response ) {
	
						if ( response.hasOwnProperty("data") ) {

							// Refill contents
							var data = response.data;

							var seqinput = "";
							var seqs = recoverSequences( data );

							for ( var s = 0; s < seqs.length; s++ ) {
								if ( seqs[s].name ) {
										seqinput = seqinput + ">"+seqs[s].name+"\n"+seqs[s].seq+"\n";
								} else {
										seqinput = seqinput + ">Seq"+s+"\n"+seqs[s].seq+"\n";
								}
							}
		
							if ( seqinput !== "" ) {
								$("#seqinput").val( seqinput );
							}

							if ( data.hasOwnProperty("params") ) {

								if ( data['params'].hasOwnProperty("dbtype") ) {

									var dbtype = data['params'].dbtype;
									$("[name=moltype]").val( dbtype );

									if ( data['params'].hasOwnProperty("db") ) {
										$(".dbselect").hide();
										$("[name="+dbtype+"list]").val( data['params'].db );
										$("[name="+dbtype+"list]").show();
									}

									if ( data['params'].hasOwnProperty("binary") ) {
										$(".methodselect").hide();
										
										var groupsel = "[name=blast-"+dbtype+"]";
										
										$(groupsel).each( function( i ){
											if ( $(this).val() === data['params'].binary ) {
												$(this).attr("checked", true );
											}
										});
										
										$("#blast-"+dbtype).css('display', 'inline-block');
									}
								}

							}

							printBLASTall( response, null, function( txt, extra ) {
								// console.log( extra );
			
								$("#blast-data").empty();
								$("#blast-data").append( txt );
								var taxonidurl = $("#blast-form").data("external-taxonid");
								addTaxonIDinBlast( taxonidurl );
							});
						}
					}
				}
			});
		}
	
	});
	
	/** Iterations **/
	$( document ).on( "click", ".itertab", function( e ) {
		
		e.preventDefault();
		var iternum = $(this).data('iter');
		
		$('.iter').hide();
		$('.iter[data-iter='+iternum+']').show();

	});

	/** Check all hits **/
	$( document ).on( "click", ".check-action > .check-all", function( e ) {
		
		e.preventDefault();

		// Only select visible
		$(".results .hit .hitcheck").prop( "checked", false );
		$(".results:visible .hit .hitcheck").prop( "checked", true );

	});

	/** Check first ten hits **/
	$( document ).on( "click", ".check-action > .check-ten", function( e ) {
		
		e.preventDefault();
		
		// Only select visible
		$(".results .hit .hitcheck").prop( "checked", false );
		$(".results:visible .hit .hitcheck").slice( 0, 10 ).prop( "checked", true );

	});

	/** Check no hits **/
	$( document ).on( "click", ".check-action > .check-none", function( e ) {
		
		e.preventDefault();
		
		$(".results .hit .hitcheck").prop( "checked", false );

	});

	function recoverSequences( data ) {

		let seqs = [];
		
		if ( data.hasOwnProperty("BlastOutput2") || data.hasOwnProperty("HMMEROutput") ) {
					
			let content = data.BlastOutput2;
			if ( ! content ) {
				content = data.HMMEROutput;
			}
						
			for ( var s=0; s < content.length; s++ ) {

				var seq = null;
				var name = null;

				if ( content[s].hasOwnProperty("seq") ) {
					seq = content[s].seq;
				}
				if ( content[s].hasOwnProperty("name") ) {
					name = content[s].name;
				}
				
				if ( seq ) {
					seqs.push( { "seq": seq, "name": name } );
				}

			}
		}

		return seqs;
	}

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
