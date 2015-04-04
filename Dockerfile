# seqservice image
# from io.js image
FROM iojs:onbuild
 
# Create App Directory and CD into it
RUN mkdir -p /opt/apps
WORKDIR /opt/apps
 
# Clone Master and Install dependencies
RUN git clone https://github.com/toniher/seqservice.git
 
# Run App
WORKDIR /opt/apps/seqservice

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

#Default port, change if necessary
EXPOSE 10030 
CMD forever index.js
