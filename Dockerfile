# seqservice image
# from node image
FROM node:carbon

MAINTAINER toniher <toniher@cau.cat>

ARG BLAST_VERSION=2.8.1
ARG SAMTOOLS_VERSION=1.9

# Handle dependencies
RUN apt-get update && apt-get -y upgrade && apt-get -y install xsltproc && \
	 apt-get clean && echo -n > /var/lib/apt/extended_states

# Blast and samtools
RUN mkdir -p /data/soft/seqservice
RUN mkdir -p /data/soft/bin

WORKDIR /data/soft

RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLAST_VERSION}/ncbi-blast-${BLAST_VERSION}+-x64-linux.tar.gz && \
	tar zxf ncbi-blast-${BLAST_VERSION}+-x64-linux.tar.gz && \
	ln -s ncbi-blast-${BLAST_VERSION}+ blast && \
	cd /data/soft/bin && ln -s /data/soft/blast/bin/* . && cd /data/soft && \
	rm -rf *tar.gz

RUN wget -q https://github.com/samtools/samtools/releases/download/${SAMTOOLS_VERSION}/samtools-${SAMTOOLS_VERSION}.tar.bz2 && \
	tar jxf samtools-${SAMTOOLS_VERSION}.tar.bz2 && \
	cd samtools-${SAMTOOLS_VERSION} && \
	make prefix=/data/soft/samtools install && \
	cd /data/soft/bin && ln -s /data/soft/samtools/bin/* . && cd /data/soft && \
	rm -rf *tar.bz2

# TEMPORARY. IN FUTURE HANDLED by App
# Download DBs
RUN mkdir -p /data/db/seqservice
WORKDIR /data/db/seqservice

# They could be retrieved via update_blast.pl
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.aa.gz && gunzip drosoph.aa.gz && \
	/data/soft/bin/makeblastdb -dbtype prot -parse_seqids -in drosoph.aa && \
	/data/soft/bin/samtools faidx drosoph.aa
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.nt.gz && gunzip drosoph.nt.gz && \
	/data/soft/bin/makeblastdb -dbtype nucl -parse_seqids -in drosoph.nt && \
	/data/soft/bin/samtools faidx drosoph.nt
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/16SMicrobial.tar.gz && tar zxf 16SMicrobial.tar.gz && \
	/data/soft/bin/blastdbcmd -db 16SMicrobial -entry all > 16SMicrobial && \
	/data/soft/bin/samtools faidx 16SMicrobial
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/swissprot.tar.gz && tar zxf swissprot.tar.gz && \
	/data/soft/bin/blastdbcmd -db swissprot -entry all > swissprot && \
	/data/soft/bin/samtools faidx swissprot
	
# Copy contents to /data/soft/seqservice
COPY . /data/soft/seqservice

# Create App Directory and cd into it
WORKDIR /data/soft/seqservice

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

# Execute npm run
RUN npm run build

#Default port, change if necessary
EXPOSE 10030 
CMD NODE_ENV=production forever index.js
