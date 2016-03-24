$(document).on( "click", '.go-exec', function() {

	$(".getGO-results").empty();
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
		var apiurl = "http://prgdb.crg.eu/api/go/commonlist/" + strProts;
		$.ajax({
			url: apiurl,
			type: 'GET',
			dataType: 'jsonp',
			error: function(xhr, status, error) {
				console.log(error);
			},
			success: function(data) {
				if ( data ) {
					for ( var group in data ) {
						if ( data.hasOwnProperty(group) ) {

							// TODO: Turn properly async
							for ( var n = 0; n < data[group].length; n = n + 1 ) {
								$(".getGOresults").append( "<p class='go'><strong>"+group+"</strong>: <a href='http://amigo.geneontology.org/amigo/term/" + data[group][n]["acc"] + "' target='_blank'>" + data[group][n]["acc"] +"</a> - <em>" + data[group][n]["name"] + "</em></p>" );
							}
						}
						
					}
				}
			}
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