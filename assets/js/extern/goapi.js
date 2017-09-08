/*globals console io $ document */

$(document).on( "click", '#go-exec', function() {

	$("#go-data").empty();
	var limit = 10;
	var listProts = [];

	var iter = 0;
	$('.hitcheck:checked').each( function( i ) {
		
		if ( iter >= 10 ) {
			return false;
		} else {
			
			iter = iter + 1;
			var content = $(this).parent().find(".id").first().text();
			var proc = getIDheader( content );
			if ( proc ) {
				listProts.push( proc );
			}
			return true;
		}
		
	});
	
	// TODO: Fix URLs
	console.log( listProts );

	if ( listProts.length > 0 ) {
		var strProts = listProts.join("-");

		// TODO: Allow different methods, more params
		var apiurl = "http://gogo.test.crg.eu/api/go/list/" + strProts + "/common";
		console.log( apiurl );
		
		$.get( { url: apiurl, dataType: "jsonp" })
			.done(function( data ) {
				//console.log( data );
				if ( data && data.hasOwnProperty('outcome') ) {
					$("#go-data").empty();
					
					for ( var key in data.outcome ) {
						if ( data.outcome.hasOwnProperty( key ) ) {
							//console.log(data.outcome[key] );
							$("#go-data").append( "<div class='go-"+key+"'>"+key+":&nbsp;</div>" );
							var group = data.outcome[key];
							var goArray = [];
							var groupkey = "go-"+key;

							for ( var n = 0; n < group.length; n = n + 1 ) {
								goArray.push( "<span class='go' data-name='"+group[n].name+"' data-definition='"+group[n].definition+"' data-acc='"+group[n].acc+"'><a target='_blank' href='http://amigo.geneontology.org/amigo/term/"+group[n].acc+"'>"+group[n].name+"</a></span>" );
							}
							
							$("#go-data ."+groupkey ).append( goArray.join(", "));
						}
					}
				}
			})
			.fail(function(  jqXHR, textStatus, errorThrown ) {
				// console.log( textStatus );
				// console.log( errorThrown );
			});

	}
});

function getIDheader( content ) {

	if ( content.indexOf("sp|") > -1 ) {

		var re = /sp\|(\S+)?\|/i;
		var found = content.match(re);
		
		if ( found.length > 0 ) {
			var split = found[1].split(".");
			if ( split[0] ) {
				return split[0];
			}
		}
	} else {
		
		if ( content.indexOf("ref|") > -1 ) {
			var re = /ref\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else if ( content.indexOf("emb|") > -1 ) {
			var re = /emb\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else if ( content.indexOf("gb|") > -1 ) {
			var re = /gb\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else if ( content.indexOf("pdb|") > -1 ) {
			var re = /pdb\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else if ( content.indexOf("prf|") > -1 ) {
			var re = /prf\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else if ( content.indexOf("dbj|") > -1 ) {
			var re = /dbj\|(\S+)?\|/i;
			var found = content.match(re);
			
			if ( found.length > 0 ) {
				return found[1];
			}
		} else {
			return null;
		}
	}


	return null;
	
}
