FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build for web
COPY . .
RUN npx expo export -p web

# Serve the web build using Nginx
FROM nginx:alpine
# Copia as configurações customizadas do nginx (para suportar rotas como /login)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
