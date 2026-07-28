FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build for web
COPY . .
RUN npx expo export -p web

# Serve the web build using Nginx
FROM nginx:alpine
# Copy custom nginx configuration if needed, or just use default. 
# We'll use the default nginx and just replace the html directory.
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
