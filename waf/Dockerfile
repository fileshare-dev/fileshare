FROM node:16.16.0
ENV WAIT_VERSION 2.9.0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /wait

RUN chmod +x /wait && npm install -g nodemon

WORKDIR /src/app/

COPY package.json package-lock.json /src/app/
RUN npm install

COPY . ./

EXPOSE 3000

CMD ["node", "/src/app/bin/www"]
