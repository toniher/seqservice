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

	console.log( message );

	var obj = JSON.parse( message );
	
	if ( obj.type == 'bypass' ) {

		
		printBypass( obj, 0, function( txt, extra ) {
			// Handle extra iter
			console.log( extra );
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
	
	// print -> Retrieve BLAST and retrieve Bypass
	
}

