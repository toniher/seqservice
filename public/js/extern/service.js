$(document).on('click', ".service-exec", function() {

	var basepath = $("body").data("basepath");

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
			
						console.log( data );
						// Data here and save
			
					});
				}
			});

		}
		
		

	
	}

});