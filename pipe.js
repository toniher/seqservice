var $p = require('procstreams');

var args = process.argv.slice(2);


if ( args.length > 0 ) {
	
	var baseText = null;
	var appstr = "";
	
	if ( args.length > 1 ) {
		baseText = args.shift();
		appstr = args.shift();
	} else {
		appstr = args.shift();
	}
	
	if ( appstr ) {
	
		var apps = JSON.parse( appstr );
		
		if ( apps.length > 0 ) {
		
			runPipe( baseText, apps, function( err, stderr, resp ){
				
				if ( resp ) {
					console.log( resp );
				}
		
				if ( err ) {
					console.error( err );
				}
			
				if ( stderr ) {
					console.error( stderr );
				}
			});
		}
	
	}
	
}

function runPipe( baseText, apps, callBack ) {

	var resp = "";

	// Default
	var commandline = $p("true");
	
	if ( baseText && ( baseText !== "" ) ) {
		commandline = $p("echo \"" + baseText + "\"" );
	}
		
	for ( var a = 0; a < apps.length; a = a + 1 ) {
		var command = apps[a].app + " " + apps[a].params;
		commandline = commandline.pipe( command );
	}
	
	commandline.data( function(err, stdout, stderr) {
		
		resp += stdout.toString();
		callBack( err, stderr, resp);
	});

}
