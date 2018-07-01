FROM node:9-alpine
ENV NODE_ENV production

# Create app directory
RUN mkdir -p /usr/src/app/client
WORKDIR /usr/src/app

# Copy nodejs dependencies
COPY package.json package-lock.json bower.json .bowerrc ./

RUN apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing fftw vips
RUN apk add --update --virtual .build-deps --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
     fftw-dev vips-dev make gcc g++ python git \
  && npm install --silent -g bower && npm install --production --silent && npm uninstall -g bower \
  && apk del .build-deps && rm -rf /var/cache/apk/*

# Copy actual application
COPY . /usr/src/app

EXPOSE 3000
CMD ["node", "/usr/src/app"]
