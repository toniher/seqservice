var $p = require('procstreams');

var args = process.argv.slice(2);


if ( args.length > 0 ) {
	
	var baseText = args.shift();
	var apps = args.shift();
	
	runPipe( baseText, JSON.parse( apps ), function( err, stderr, resp ){
		
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

function runPipe( baseText, apps, callBack ) {

	var resp = "";

	// Default
	var commandline = $p("true");
	console.log( baseText );
	
	if ( baseText && ( baseText !== "" ) ) {
		commandline = $p("echo \"" + baseText + "\"" );
	}
		
	for ( var a = 0; a < apps.length; a = a + 1 ) {
		var command = apps[a].app + " " + apps[a].params;

		commandline = commandline.pipe( command );
	}
	
	console.log( commandline );

	commandline.data( function(err, stdout, stderr) {
		
		resp += stdout.toString();
		callBack( err, stderr, resp);
	});

}