FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./


RUN npm install --include=dev


COPY . .


RUN npm run build


EXPOSE 3000

# Start the app
CMD ["npm", "start"]
