FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm --version
RUN npm install --include=dev
RUN npx nodemon --version || echo "nodemon not found"

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]