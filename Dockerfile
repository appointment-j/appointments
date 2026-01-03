# This Dockerfile is for the backend service
# For the complete application setup, use docker-compose.yml

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]

