FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
RUN apt-get update && apt-get install -y python3-distutils
RUN npm install --include=dev
RUN npm install @mui/x-date-pickers @date-io/date-fns date-fns
RUN npm install --save-dev @types/date-fns

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]