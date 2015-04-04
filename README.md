# seqservice
NodeJS express API for handling biological sequences

## INSTALLATION

### Server configuration

* Dependencies
	* NCBI-BLAST
	* xsltproc
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

	npm install
    node index.js
    
    FUN!


## TODO
* Provide more information in the queries
* Allow parameter prefix for IDs (to use in CouchDB)
* Docker installation

