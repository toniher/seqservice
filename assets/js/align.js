/*globals console io $ document */

var basicAlign = {};

$(function() {
	$(document).on( "click", '#align-exec', function() {

		let $container = $(this).closest(".blast");
		
		let $hitchecked = $container.find("input.hitcheck").filter(":checked");

		let $hits = [];
		
		$hitchecked.each( function( item ) {

			$hits.push( $(this).parent() );
												
		});
				
		basicAlign.init( $container, $hits );
		
	});
	
	basicAlign.init = function( $container, $hits ) {
		
		// Retrieve original sequence from DOM
		let mainseq = null;
		let alignment;
		
		if ( $container.data( "seq" ) && $container.data( "seq" ) !== "undefined" ) {
			mainseq = $container.data( "seq" );
			mainseq = mainseq.replace("\n", "");
		}
		
		console.log( mainseq );
		
		// Retrieve selection from DOM
		let seqStruct = basicAlign.addAlignments( $hits );
		
		// Put all together
		alignment = basicAlign.putTogether( mainseq, seqStruct );
		
		console.log( alignment );
		
		return alignment;
		
	};
	
	basicAlign.addAlignments = function( $hits ) {
		
		let seqStruct = [];
		
		$($hits).each( function( i ) {
			
			let hsps = [];
			
			let hit = this;
			
			$(hit).find( ".hsps .hsp" ).each( function( h ) {
				
				// For each hsp
				let hsp = this;

				// Get first start of query
				let hstart = $(hsp).data("hstart");
				// Get last end of query
				let hend = $(hsp).data("hend");
				// Get all seq fr
				let hseq = "";
								
				$(hsp).find(".align").each( function( a ) {
					
					hseq = hseq + $(this).find( ".seq-hit .actual ").text();
					
				});
				
				hsps[h] = {};
				hsps[h].start = hstart;
				hsps[h].end = hend;
				hsps[h].seq = hseq;
				
			});
			
			
			let hitStruct = basicAlign.mergeHsps( hsps );
			
			seqStruct.push( hitStruct );
			
		});
		
		
		return seqStruct;
		
	};
	
	basicAlign.mergeHsps = function( hsps ) {
		
		// TODO: Process duferent hsps - now only first
		
		let hitStruct = {};
		
		if ( hsps.length > 0 ) {
			hitStruct = hsps[0];
		}

		return hitStruct;
	};
	
	basicAlign.putTogether = function( mainseq, seqStruct ) {
		
		// TODO - Make it work
		
		let alignment = "";
		let seqArray = [];
		
		seqArray[0] = mainseq.split("");
		
		for ( let s = 0; s < seqStruct.length; s++ ) {
			let start = seqStruct[s].start;
			let end = seqStruct[s].start;
			let seq = seqStruct[s].seq;
			
			let n = s + 1;
			seqArray[n] = [];
			
			for ( let i = 0; i < start; i = i + 1 ) {
				seqArray[n].push( "-" ); // Fill with empty spaces
			}
			
			let tempseq = seq.split("");
			
			for ( let t = 0; t < tempseq.length; t = t + 1 ) {
				seqArray[n].push( tempseq[t] ); // Fill with sequence
			}

			for ( let e = 0; e < end; e = e + 1 ) {
				seqArray[n].push( "-" ); // Fill with empty spaces
			}
			
		}
		
		for ( let q = 0; q < seqArray.length; q = q + 1 ) {
			alignment = alignment + seqArray[q].join("") + "\n";
		}
		
		return alignment;
	
	};
	
});



