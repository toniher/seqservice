$(document).ready( function(){

	var basepath = $("body").data("basepath");
	var socketio = $("body").data("socketio");


	if ( socketio ) {
		var socket = io.connect( { path: basepath + "/socket.io" } );
		socket.on('service', function(message) {
			prepareHTMLService( message );
		});
	}
	
});

$(document).on('click', ".service-exec", function() {

	var basepath = $("body").data("basepath");
	var socketio = $("body").data("socketio");
		
	// Get service
	if ( $(this).data('id') ) {
		
	
		var service = $(this).data('id');
		
		var paramclass = service + "-param";
		
		var params = {};
		progparams = {};
		
		$( "." + paramclass ).each( function( i ) {
			var name = $(this).attr( "name" );
						
			var val = $(this).val();
			
			if ( name ) {
				progparams[ name ] = val;
			}
			
		});
		
		// Last param - actual service
		params.type = service;
		
		// Get object id
		var objectid = $("#blast-data").data("id");
		
		// Generate ID for Bypass
		
		if ( objectid ) {

			pouchdb_retrieve( "reports", objectid, function( err, obj ) {
				
				if ( ! err ) {
					
					params.ref = objectid;
					params.params = JSON.stringify( progparams )
					params.input = JSON.stringify( obj.data ); // Otherwise we lose types
					
					$.post( basepath+"/service", { params: params }).done( function( data ) {
						
						if ( ! socketio ){
							prepareHTMLService( data );
						}
			
					});
				}
			});

		}
	
	}

});


function prepareHTMLService( message ) {

	// console.log( message );

	var obj = JSON.parse( message );
	
	if ( obj.type == 'bypass' ) {

		
		printBypass( obj, 0, function( txt, extra ) {
			// Handle extra iter
			console.log( extra );
			$("#blast-data").empty();
			$("#blast-data").append( txt ); 

			if ( $("#blast-data .iter").length > 0 ) {
				$( "#blast-data .iter" ).each( function( i ) {
					var iter = i + 1;
					
					tinysort( "#blast-data .iter:nth-of-type("+iter+") .results > .hit", { data:'new'} );
				});
			} else {
				tinysort( "#blast-data .results > .hit", { data:'new'} );
			}
			
			
		});
	
	}
	
}

function printBypass( message, parse, target ) {
	
	var obj;
	if ( parse ) {
		obj = JSON.parse( message );
	} else {
		obj = message;
	}
	
	console.log( obj );
	
	var extra = {};
	
	pouchdb_report( "reports", obj, function( db, obj, err ) {

		if ( ! err ) {
			
			if ( obj._id ) {
				// Set data
				addDOMdata( "#blast-data", "id", obj._id );
			}
	
			if ( obj.hasOwnProperty("data") ) {
				
				var reorder = obj["data"]["results"];
				
				if ( obj.hasOwnProperty("ref") ) {
					
					ref = obj.ref;
					
					// Retrieve ref
					pouchdb_retrieve( "reports", ref, function( err, doc ) {
						
						if ( ! err ) {
							if ( doc.hasOwnProperty("data") ) {
								
								// All objects should have data part
				
								if ( doc["data"].hasOwnProperty("BlastOutput2") ) {
									
									blastObj = doc["data"]["BlastOutput2"];
													
									if ( blastObj instanceof Array ) {
										
										// Move async
										var iter = 0;
										var str = "";
								
										async.eachSeries(blastObj, function(blastIter, callback) {
											
											str = str + printBLAST( blastIter, iter, reorder );
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
										str = printBLAST( blastObj, 0, reorder );
										target( str );
									}
								}
								
								
							}
						}
						
						
					});

				}
		

		
			}
	
		}
	});
	
}

