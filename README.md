# seqservice
NodeJS express API for handling biological sequences

## INSTALLATION

### Server configuration

* Assuming we define /api as basepath, and we keep 10030 port in config.json

#### Apache

# Reverse proxy seqservice
RewriteEngine On
RewriteRule ^/api/(.*)$ http://localhost:10030/api/$1 [P]

ProxyPass        /socket.io http://localhost:10030/socket.io
ProxyPassReverse /socket.io http://localhost:10030/socket.io


#### NGINX

upstream api {
    server localhost:10030;
}

server {

   ...


    location /socket.io {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api {
        proxy_http_version 1.1;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-NginX-Proxy    true;
        proxy_set_header   Host             $http_host;
        proxy_set_header   Upgrade          $http_upgrade;
        proxy_redirect     off;
        proxy_pass         http://api;
    }
    ...

}


### Application start

From the directory of the application

	npm install





## TODO
* Allow multiple indexing
* Allow other indexing
	* samtools faidx
	* python faidx
* Allow parameter prefix for IDs (to use in CouchDB)
