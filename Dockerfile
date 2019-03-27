#FROM node:10.15
FROM node:10.15-stretch


WORKDIR /home/server
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY package.json package-lock.json* ./
# RUN apt-get install \
#     python \
#     make \
#     g++
RUN npm install
COPY . /usr/app

ENV PORT 4400
EXPOSE 4400

CMD ["node", "app.js"]



# FROM node:10.15

# RUN mkdir /build
# WORKDIR /build

# COPY package.json package-lock.json* ./
# RUN npm install


# FROM node:10.15-alpine
# FROM baseimage:latest
# https://hub.docker.com/_/node/

# install dependencies
# WORKDIR /home/server
# RUN mkdir -p /usr/app
# WORKDIR /usr/app
# COPY --from=0 /build/node_modules ./node_modules
# RUN npm install -g node-gyp
# RUN npm rebuild
# COPY . /usr/app
# COPY package.json package-lock.json* ./
# RUN npm install

# RUN apk --no-cache --virtual build-dependencies add \
#     python \
#     make \
#     g++ \
#     && npm install node-gyp \
#     && npm install \
#     && apk del build-dependencies

# copy app source to image _after_ npm install so that
# application code changes don't bust the docker cache of npm install step

# set application PORT and expose docker PORT, 80 is what Elastic Beanstalk expects
# ENV PORT 4400
# EXPOSE 4400

# CMD [ "npm", "run", "start" ]
# CMD ["node", "app.js"]