# seqservice image
# from io.js image
FROM iojs:onbuild
MAINTAINER toniher <toniher@cau.cat>

# Handle dependencies
RUN apt-get update && apt-get -y upgrade && apt-get -y install xsltproc && \
	 apt-get clean && echo -n > /var/lib/apt/extended_states

# Blast and samtools
RUN mkdir -p /opt/soft
WORKDIR /opt/soft

RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.2.30/ncbi-blast-2.2.30+-x64-linux.tar.gz && \
	tar zxf ncbi-blast-2.2.30+-x64-linux.tar.gz && \
	ln -s ncbi-blast-2.2.30+ blast && \
	rm -rf *tar.gz

RUN wget -q https://github.com/samtools/samtools/releases/download/1.2/samtools-1.2.tar.bz2 && \
	tar jxf samtools-1.2.tar.bz2 && \
	cd samtools-1.2 && \
	make prefix=/opt/soft/samtools install && cd .. \
	rm -rf *tar.bz2

# TEMPORARY. IN FUTURE HANDLED by App
# Download DBs
RUN mkdir -p /opt/db
WORKDIR /opt/db

RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.aa.gz && gunzip drosoph.aa.gz && \
	/opt/soft/blast/bin/makeblastdb -dbtype prot -parse_seqids -in drosoph.aa
RUN wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.nt.gz && gunzip drosoph.nt.gz && \
	/opt/soft/blast/bin/makeblastdb -dbtype nucl -parse_seqids -in drosoph.nt

# Create App Directory and cd into it
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Clone Master and Install dependencies
RUN git clone https://github.com/toniher/seqservice.git
 
# Run App
WORKDIR /opt/app/seqservice

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

#Default port, change if necessary
EXPOSE 10030 
CMD forever index.js
