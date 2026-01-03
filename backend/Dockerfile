FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install ALL dependencies for the build step
RUN npm ci

COPY . .
RUN npm run build

# Create production image with only production dependencies
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=0 /app/dist ./dist

EXPOSE 5000

CMD ["npm", "start"]