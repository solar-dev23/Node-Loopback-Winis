FROM node:8.6

ENV NODE_ENV production

# Create app directory
RUN mkdir -p /usr/src/app/client
WORKDIR /usr/src/app

# Install nodejs dependencies
COPY package.json .
RUN npm install --production

# Run node-prune
# RUN apt install -y golang-go && go get github.com/tj/node-prune/cmd/node-prune && node-prune && apt remove golang

# Install bower dependencies
#COPY bower.json .
#COPY .bowerrc .
#RUN node node_modules/bower/bin/bower --allow-root install

# Copy actual application
COPY . /usr/src/app

EXPOSE 3000
CMD ["node", "/usr/src/app"]
