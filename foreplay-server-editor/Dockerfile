FROM mhart/alpine-node:10.10.0

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*
RUN apk --update add imagemagick && \
    rm -rf /var/cache/apk/*

# shared
COPY /shared/ /usr/src/app/shared/

# server
WORKDIR /usr/src/app/server-editor
COPY /server-editor/package.json server-editor/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-editor/src ./src