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

	upstream api {
	    server localhost:10030;
	}
	
	server {
	   ...
	
	    location /seqservice/socket.io {
	        proxy_pass http://seqservice;
	        proxy_http_version 1.1;
	        proxy_set_header Upgrade $http_upgrade;
	        proxy_set_header Connection "upgrade";
	    }
	
	    location /seqservice {
	        proxy_http_version 1.1;
	        proxy_set_header   X-Real-IP        $remote_addr;
	        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
	        proxy_set_header   X-NginX-Proxy    true;
	        proxy_set_header   Host             $http_host;
	        proxy_set_header   Upgrade          $http_upgrade;
	        proxy_redirect     off;
	        proxy_pass         http://seqservice;
	    }
	    ...
	
	}

### Application start

From the directory of the application

	npm install -g bower-installer
	npm install
	bower-installer
	node index.js

	FUN!

## Docker installation

From this repository:

	sudo docker build -t seqservice .
	sudo docker run -p 10030:10030 -d seqservice
	
	Open your browser at http://localhost:10030/seqservice/


## TODO
* Download results in different forms (JSON, CSV, etc.)
* Download databases if needed
* Allow parameter prefix for IDs (to use in CouchDB)
* Keep JSON object in BLAST for better reuse: Session, DB
* More coherent system of keeping params in configuration
* Retrieve ids of species at once
* Keep track of submissions. Plug a task queue or submit to a cluster

