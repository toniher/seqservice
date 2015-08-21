var functions = require('./index.js');

// We assume already JSON work
exports.getRequest = function( urlinput ) {

	var reqopts = {
			url: urlinput,
			headers: {
					'User-Agent': 'request',
					'Accept' : 'application/json'
			}
	};
	return reqopts;
};

// Here we control the output, either in JSON or JSONP
exports.returnJSON = function( res, object ) {

	// If configured JSONP
	if ( res.app.set('config').jsonp ) {
		res.jsonp( object );
	} else {
		res.set( 'Content-Type', 'application/json' );
		res.send( object );
	}

};

// Here we provoke download the file
exports.downloadFasta = function( res, stdout, entry ) {

	var filename = "fasta";
	if ( entry ) {
		filename = entry;
	}

	res.set( 'Content-Type', 'text/x-fasta' );
	res.set( 'Content-Disposition', 'attachment; filename=' + filename + ".fasta" );

	res.send( stdout );

};

exports.getPath = function( term, object ) {

	for ( var dbtype in object ) {
		if ( object.hasOwnProperty(dbtype) ) {
			for ( var item in object[dbtype] ) {
				if ( object[dbtype].hasOwnProperty(item) ) {
					if ( item === term ) {
						return object[dbtype][item];
					}
				}
			}
		}
	}
	
	return '';
};

exports.printBlastHTML = function ( object, res ) {

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
			str = str + processHits( iterationlist[iter].search.hits );
			str = str + "</div>";
		}

	} else {
		console.log( "TAL" );
		str = str + "<div class='results'>";
		str = str + processHits( blastobj.results.search.hits );
		str = str + "</div>";
	}

	if ( str === "" ) {
		str = "<p class='not-found'>No hits found.</p>";
	}

	if ( res ){
		res.set( 'Content-Type', 'text/html' );
		res.send( str );
	} else {
		return str;
	}

};

exports.matchInArray = function( groups, tomatch ) {
	
	for ( var i = 0; i < groups.length; i = i +1 ) {

		if ( tomatch.indexOf( groups[i] ) > -1 ) {
			return i;
		}
	}
	
	return -1;
}

function processHits( hits ) {

	var str = "";

	for ( var hit = 0; hit < hits.length; hit = hit + 1 ) {
		
		str = str + "<div class='hit'>";
		str = str + "<span class='id'>" + hits[hit].description[0].id + "</span>"; // Assume first desc
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

		content+="<div class='seq'><span class='frame'>"+content_query_frame+"</span><span class='start'>"+start1+"</span><p>"+arrSeqs["qseq"][qst]+"</p><span class='end'>"+end1+"</span></div>";
		content+="<div class='seq mid'><span class='frame'></span><span class='start'></span><p>"+arrSeqs["midline"][qst]+"</p><span class='end'></span></div>";
		content+="<div class='seq'><span class='frame'>"+content_hit_frame+"</span><span class='start'>"+start2+"</span><p>"+arrSeqs["hseq"][qst]+"</p><span class='end'>"+end2+"</span></div>";
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

