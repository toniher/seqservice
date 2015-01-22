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

	var expect = obj.params.expect;
	var gopen = obj.params.gap_open;
	var gextend = obj.params.gap_extend;
	var str = "";

	var results = obj.results;


	for ( var result = 0; result < results.length; ++result ) {
		var iters = results[result].iters;
		for ( var iter = 0; iter < iters.length; ++iter ) {
			var hits = iters[iter].hits;
			for ( var hit = 0; hit < hits.length; ++hit ) {
				
				str = str + "<div class='hit'>";
				str = str + "<span class='id'>" + hits[hit].id + "</span>";
				str = str + "<span class='evalue'>" + hits[hit].hsps[0].evalue + "</span>"; // Higher value
				str = str + "<span class='details'>Details...</span>"; // Details
				str = str + "<div class='hsps'>" + processHsps( hits[hit].hsps ) + "</div>";
				str = str + "</div>"
			}
		}
	}

	if ( str === "" ) {
		str = "<p class='not-found'>No hits found.</p>";
	}

	//{ "_id":"", "type":"blast", "ref":"", "db":"blastdb", "program":"blastn", "seqtype":"prot", "maxiters":"1", "username":"Anonymous", "date":"", "params": { "expect":10, "gap_open":0, "gap_extend":0, "filter":"L;m;" }, "results": [ { "iters":[ { "num":1, "hits":[ { "num":1, "def":"No definition line", "id":"AC155610.2_FGT009", "length": 204, "hsps":[ { "num":1, "bit_score":226.412, "score":122, "evalue":3.07661e-59, "qstart":1, "qend":122, "hstart":7, "hend":128, "query_frame":1, "hit_frame":1, "identity":122, "positive":122, "gaps":0, "length":122, "qseq":"TGTGTGCGTTCGATTCGCTTCTGCTGCAGCTAGGGTTTAGAGGTTTTCTGGGCGCGGAGCGGGAGGCGGCGGCGGCTATGGCTGCGGCGGAGGAGGAGATCGCGGTGAAGGAGCCGCTGGAT", "midline":"||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||", "hseq":"TGTGTGCGTTCGATTCGCTTCTGCTGCAGCTAGGGTTTAGAGGTTTTCTGGGCGCGGAGCGGGAGGCGGCGGCGGCTATGGCTGCGGCGGAGGAGGAGATCGCGGTGAAGGAGCCGCTGGAT" } ] } ] } ], "length":122, "def":"ENTRY" } ] }

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


function processHsps( hsps ) {
	// TODO: Process HSPS -> Show it somehow

	var content = "";

	for ( var iter = 0; iter < hsps.length; ++iter ) {
		var qseq = hsps[iter].qseq;
		var midline = hsps[iter].midline;
		var hseq = hsps[iter].hseq;
		var bit_score = hsps[iter].bit_score;
		var score = hsps[iter].score;
		var evalue = hsps[iter].evalue;
		var qstart = hsps[iter].qstart;
		var qend = hsps[iter].qend;
		var hstart = hsps[iter].hstart;
		var hend = hsps[iter].hend;
		var query_frame = hsps[iter].query_frame;
		var hit_frame = hsps[iter].hit_frame;
		var identity = hsps[iter].identity;
		var positive = hsps[iter].positive;
		var gaps = hsps[iter].gaps;
		var length = hsps[iter].length;

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
		content+="<div class='seq'><span class='frame'>"+query_frame+"</span><span class='start'>"+start1+"</span><p>"+arrSeqs["qseq"][qst]+"</p><span class='end'>"+end1+"</span></div>";
		content+="<div class='seq mid'><span class='frame'></span><span class='start'></span><p>"+arrSeqs["midline"][qst]+"</p><span class='end'></span></div>";
		content+="<div class='seq'><span class='frame'>"+hit_frame+"</span><span class='start'>"+start2+"</span><p>"+arrSeqs["hseq"][qst]+"</p><span class='end'>"+end2+"</span></div>";
		content+="</div>";

		count++;
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

