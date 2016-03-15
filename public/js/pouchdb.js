function pouchdb_report( dbname, obj, cb ) {

	err = null;
	db = new PouchDB(dbname);
	cb( db, obj, err );

}