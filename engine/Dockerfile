FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . .


RUN npm run build



CMD ["node", "dist/index.js"]
