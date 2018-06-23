# seqservice
NodeJS express API for handling biological sequences analyses

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
* FIXING Websocket access behind proxies such as NGINX
* Webpack: Consider putting manifest for hashed version
* Webpack and npm run: enable proper PRODUCTION and DEVELOPMENT behaviour 
* Allow single-hit accompanying analyses (e.g. ProtLoc or GO)
* Generate alignment from results at user's choice
* Start PSIBLAST from user choice of sequences
* Include more HMMER options
* Download results in different formats (CSV, etc.)
* Allow syncing/saving with a DB (e. g. CouchDB)
* Plug a task queue. By using https://github.com/paulmillr/chokidar and maybe Nextflow
* Download input databases if needed (through CLI or web interface)
* Plug an embeddable Genome Browser (e. g. igv.js)
* More coherent system of keeping params in configuration for more different analyses
* Fix error when PouchDB executed for first time (empty store)

