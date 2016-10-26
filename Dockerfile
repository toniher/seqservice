# seqservice image
# from node image
FROM node:5-onbuild

MAINTAINER toniher <toniher@cau.cat>

# Handle dependencies
RUN apt-get update && apt-get -y upgrade && apt-get -y install xsltproc && \
	 apt-get clean && echo -n > /var/lib/apt/extended_states

# Blast and samtools
RUN mkdir -p /data/soft
RUN mkdir -p /data/soft/bin

WORKDIR /data/soft

RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.5.0/ncbi-blast-2.5.0+-x64-linux.tar.gz && \
	tar zxf ncbi-blast-2.5.0+-x64-linux.tar.gz && \
	ln -s ncbi-blast-2.5.0+ blast && \
	cd bin && ln -s ../blast/bin/* . && cd .. && \
	rm -rf *tar.gz

RUN wget -q https://github.com/samtools/samtools/releases/download/1.3/samtools-1.3.tar.bz2 && \
	tar jxf samtools-1.3.tar.bz2 && \
	cd samtools-1.3 && \
	make prefix=/data/soft/samtools install && cd .. \
	cd bin && ln -s ../samtools/bin/* . && cd .. && \
	rm -rf *tar.bz2

# TEMPORARY. IN FUTURE HANDLED by App
# Download DBs
RUN mkdir -p /data/db/seqservice
WORKDIR /data/db/seqservice

# They could be retrieved via update_blast.pl
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.aa.gz && gunzip drosoph.aa.gz && \
	/data/soft/bin/makeblastdb -dbtype prot -parse_seqids -in drosoph.aa
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.nt.gz && gunzip drosoph.nt.gz && \
	/data/soft/bin/makeblastdb -dbtype nucl -parse_seqids -in drosoph.nt
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/16SMicrobial.tar.gz && tar zxf 16SMicrobial.tar.gz
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/swissprot.tar.gz && tar zxf swissprot.tar.gz

# Create App Directory and cd into it
WORKDIR /data/soft

# Clone Master and Install dependencies
RUN git clone https://github.com/toniher/seqservice.git
 
# Run App
WORKDIR /data/soft/seqservice

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

# Install Bower deps
RUN npm install -g bower-installer
RUN bower-installer

#Default port, change if necessary
EXPOSE 10030 
CMD forever index.js
