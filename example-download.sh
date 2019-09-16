#!/bin/bash

set -euo pipefail

DBDIR=/data/db/seqservice
cd $DBDIR

# Directly via wget and formatting, update_blast.pl could also be done
wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.aa.gz && gunzip drosoph.aa.gz && \
	/data/soft/bin/makeblastdb -dbtype prot -parse_seqids -in drosoph.aa && \
	/data/soft/bin/samtools faidx drosoph.aa
wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/FASTA/drosoph.nt.gz && gunzip drosoph.nt.gz && \
	/data/soft/bin/makeblastdb -dbtype nucl -parse_seqids -in drosoph.nt && \
	/data/soft/bin/samtools faidx drosoph.nt

wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/16SMicrobial.tar.gz && tar zxf 16SMicrobial.tar.gz && \
	/data/soft/bin/blastdbcmd -db 16SMicrobial -entry all > 16SMicrobial && \
	/data/soft/bin/samtools faidx 16SMicrobial
wget -q ftp://ftp.ncbi.nlm.nih.gov/blast/db/swissprot.tar.gz && tar zxf swissprot.tar.gz && \
	/data/soft/bin/blastdbcmd -db swissprot -entry all > swissprot && \
	/data/soft/bin/samtools faidx swissprot
	
