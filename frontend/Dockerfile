FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install ALL dependencies for the build step
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=0 /app/dist .

# Create a basic nginx configuration
RUN echo "server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    index index.html;\n    try_files $uri $uri/ /index.html;\n  }\n  location /api {\n    proxy_pass http://backend:5000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_cache_bypass $http_upgrade;\n  }\n}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]