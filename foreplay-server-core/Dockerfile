FROM mhart/alpine-node:10.10.0

    
# shared
COPY /foreplay-shared/ /usr/src/app/foreplay-shared/

# server
WORKDIR /usr/src/app/foreplay-server-core
COPY /foreplay-server-core/package.json /foreplay-server-core/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY foreplay-server-core/src ./src