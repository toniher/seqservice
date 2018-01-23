# seqservice
NodeJS express API for handling biological sequences

[![DOI](https://zenodo.org/badge/29487880.svg)](https://zenodo.org/badge/latestdoi/29487880)

## INSTALLATION

### Server configuration

* Dependencies
	* NCBI-BLAST
	* Samtools (optional)

* Assuming we define /seqservice as basepath, and we keep 10030 port in config.json

#### Apache

	# Reverse proxy seqservice
	RewriteEngine On
	RewriteRule ^/seqservice/(.*)$ http://localhost:10030/seqservice/$1 [P]
	
	ProxyPass        /seqservice/socket.io http://localhost:10030/seqservice/socket.io
	ProxyPassReverse /seqservice/socket.io http://localhost:10030/seqservice/socket.io


#### NGINX

Check example `nginx.conf` file


### Application start

From the directory of the application

	npm install
	npm run build
	NODE_ENV=production node index.js

	FUN!

## Docker installation

From this repository:

	sudo docker build -t seqservice .
	sudo docker run -p 10030:10030 -d seqservice
	
	Open your browser at http://localhost:10030/seqservice/


## TODO
* Webpack: Consider putting manifest for hashed version
* Keep track of submissions
* Allow single-hit accompanying analyses (e.g. ProtLoc or GO)
* Generate alignment from results at user's choice
	* Start PSIBLAST from user choice of sequences
* Include more HMMER options
* Save other analysis in DB
* Download results in different formats (CSV, etc.)
* Allow syncing with CouchDB
* More coherent system of keeping params in configuration
* Plug a task queue or submit to a cluster
* Download databases if needed
