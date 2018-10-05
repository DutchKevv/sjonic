FROM mhart/alpine-node:10.10.0

    
# shared
COPY /shared/ /usr/src/app/shared/

# server
WORKDIR /usr/src/app/server-core
COPY /server-core/package.json /server-core/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY server-core/src ./src