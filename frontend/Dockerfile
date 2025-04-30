FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
RUN apt-get update && apt-get install -y python3-distutils
RUN npm install --include=dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]