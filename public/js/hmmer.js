/*globals console io $ document */

var hmmer3process = {};

$(function() {

	hmmer3process.init = function( text, limit ) {

		let data = [];
		let alignments = false;

		let seqiter = -1;
		let domiter = -1;
		let alniter = -1;

		let title = "";
		let length = 0;
		let roundnum = 0;

		let noSkip = true;

		let hit_title = "";
		let hit_prev_title = "";

		let lines = text.split("\n");

		for ( let line of lines ) {

			if ( line.startsWith("#") ) {
				// It's a comment, so continue
				continue;
			}

			// If starts with "Query:"
			if ( line.startsWith("Query:") ) {

				let parts = line.split(/\s+/);
				title = parts[1];
				prelength = parts[2];
				//print prelength
				let prelength = prelength.replace("[L=", "");
				length = parseInt( prelength.replace("]", ""), 10 );

				continue;
			}

			// After ->  Domain annotation for each sequence (and alignments):
			if ( line.startsWith("Domain annotation for each sequence") ) {

				alignments = true;
				
				data.push( { } );
				data[roundnum]["iter_num"] = roundnum + 1;
				data[roundnum]["search"] = {};
				data[roundnum]["search"]["query_title"] = title;
				data[roundnum]["search"]["query_len"] = length;
				data[roundnum]["search"]["hits"] = [];
		
				seqiter = -1;
				domiter = -1;
				alniter = -1;
		
				continue;
			}

			// End -> Internal pipeline statistics summary:
			if ( line.startsWith("Internal pipeline statistics summary:") ) {

				alignments = false;
				continue;
			}


			// End -> Internal pipeline statistics summary:
			if ( line.startsWith("@@ Round:") ) {

				roundnum = roundnum + 1;
				continue;
			}


			// HIT -> Check if repeated!
			// if ">>" -> Process entry
			if ( line.startsWith(">>") ) {

				hit_title = line.trim().replace(">> ", "");
				domiter = -1;

				if ( hit_title != hit_prev_title ){

					seqiter = seqiter + 1;
					
					if ( seqiter >= limit ) {
						noSkip = false;
						continue;
					}

					// Positions of start and end
					qstart = 0;
					qend = 0;

					// Positions of start and end
					hstart = 0;
					hend = 0;

					// print seqiter

					data[roundnum]["search"]["hits"].push( {} ); // We append
					data[roundnum]["search"]["hits"][seqiter]["num"] = seqiter + 1;
					data[roundnum]["search"]["hits"][seqiter]["description"] = [];
					data[roundnum]["search"]["hits"][seqiter]["description"].push( {} );
					data[roundnum]["search"]["hits"][seqiter]["description"][0]["title"] = line.trim().replace(">> ", ""); // Need to process as well
					data[roundnum]["search"]["hits"][seqiter]["hsps"] = [];

					hit_prev_title = hit_title;

					noSkip = true;
				} else {
					noSkip = false;

				}

				continue;

			}

			if ( line.match( /^\s+\=\=\sdomain\s\d+/ ) && noSkip ) {
				domiter = domiter + 1;
				alniter = 0;
				let scoreinfo = line.match(/^\s*\=\=\sdomain\s(\d+)\s+score\:\s+(\S+)\sbits\;\s+conditional\s+E-value\:\s+(\S+)/);
				data[roundnum]["search"]["hits"][seqiter]["hsps"].push( {} );

				//print scoreinfo.groups()
				data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["num"] = parseInt( scoreinfo[0], 10 );
				data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["score"] = parseFloat( scoreinfo[1] );
				data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["evalue"] = parseFloat( scoreinfo[2] );
				continue;
			}

			// TODO: Finish translating from Python
			//# And different domains
			//if re.match( "^\s*"+title, line ) and alniter == 0 :
			//	queryinfo = re.match( "^\s*\S.*\s*(\d+)\s(.*)\s(\d+)\s*$", line );
			//	#print queryinfo.groups()
			//	alniter = alniter + 1
			//	#pstart = re.compile("^\s*"+title+"\S*\s*\d+\s")
			//	#qstart = re.search(pstart, line).end()
			//	#print qstart
			//	#print line[qstart]
			//
			//	qstart = re.compile("^\s*\S+\s*\d+\s")
			//	qstart = re.search(qstart, line).end()
			//
			//
			//	qend = re.compile("\s\d+\s*$")
			//	qend = re.search(qend, line).start() - 1
			//
			//	#print qend
			//	#print line[qend]
			//
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_from"] = int( qstart )
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["query_to"] = int( qend )
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["qseq"] = line[qstart:qend+1]
			//
			//	continue
			//
			//if re.match( "^\s*.*\s*$", line ) and alniter == 1 :
			//	#print line
			//	#print "mid: *"+line[qstart:qend+1] + "*"
			//
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["midline"] = line[qstart:qend+1]
			//
			//	alniter = alniter + 1
			//	continue
			//
			//if re.match( "^\s*\S+\s*\d+\s.*\s\d+\s*", line ) and alniter == 2 :
			//
			//	hitinfo = re.match( "^\s*\S+\s*(\d+)\s(.*)\s(\d+)\s*$", line );
			//	#print hitinfo.groups()
			//
			//	alniter = alniter + 1
			//	hstart = re.compile("^\s*\S+\s*\d+\s")
			//	hstart = re.search(hstart, line).end()
			//	#print hstart
			//	#print line[hstart]
			//
			//	hend = re.compile("\s\d+\s*$")
			//	hend = re.search(hend, line).start() - 1
			//	#print hend
			//	#print line[hend]
			//
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_to"] = int( hstart )
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hit_end"] = int( hend )
			//
			//	data[roundnum]["search"]["hits"][seqiter]["hsps"][domiter]["hseq"] = line[hstart:hend+1]
			//
			//	continue

		}

		outcome = {};
		outcome["HMMEROutput"] = {};
		outcome["HMMEROutput"]["report"] = {};
		outcome["HMMEROutput"]["report"]["results"] = {};
		outcome["HMMEROutput"]["report"]["results"]["iterations"] = data;

		return outcome;

	};

});