FROM node:9-alpine

ENV NODE_ENV production

# Create app directory
RUN mkdir -p /usr/src/app/client
WORKDIR /usr/src/app

# Install nodejs dependencies
COPY package.json package-lock.json bower.json .bowerrc ./
#RUN apk add --no-cache --virtual .build-deps make gcc g++ python \
# && npm install --production --silent \
# && apk del .build-deps
RUN npm install --production --silent

# Install bower components
RUN npm install --global bower && apk add --no-cache --virtual .bower git \
&& bower --allow-root --silent install && npm uninstall --global bower \
&& apk del .bower

# Copy actual application
COPY . /usr/src/app

EXPOSE 3000
CMD ["node", "/usr/src/app"]
