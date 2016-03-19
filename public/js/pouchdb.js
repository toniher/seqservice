function pouchdb_report( dbname, obj, cb ) {

	err = null;
	db = new PouchDB(dbname);
	
	db.get(obj._id).then(function (doc) {
		
		// Already existing entry
		if ( doc ) {
			// TODO: Maybe modifying for poiting new access
			cb( db, obj, err );
		}
		
	}).catch(function (errget) {
		
		if ( errget.status === 404 ) {
			
			db.put(obj);
		}
		
		cb( db, obj, err );

	}); 
	
}