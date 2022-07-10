FROM node:16.16.0 as build-deps
RUN mkdir -p /src/app
WORKDIR /src/app
COPY package.json package-lock.json /src/app/
RUN npm install
RUN npm install -g react-scripts

COPY src/ /src/app/src/
COPY public/ /src/app/public/
RUN npm run build

FROM nginx:latest

COPY --from=build-deps /src/app/build /etc/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
