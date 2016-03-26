$(document).on('click', ".service-exec", function() {

	var basepath = $("body").data("basepath");

	// Get service
	if ( $(this).data('id') ) {
		
	
		var service = $(this).data('id');
		
		var paramclass = service + "-param";
		
		var params = {};
		
		$( "." + paramclass ).each( function( i ) {
			var name = $(this).attr( "name" );
						
			var val = $(this).val();
			
			if ( name ) {
				params[ name ] = val;
			}
			
		});
		
		// Last param - actual service
		params._id = service;
		
		console.log( params );
		
		$.post( basepath+"/service", { params: params  }).done( function( data ) {

			console.log( data );

		});
	
	}

});