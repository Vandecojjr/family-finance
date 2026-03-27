# Stage 1: Build the Frontend (Vite)
FROM node:20-alpine AS build-web
WORKDIR /app
COPY Web/package*.json ./
RUN npm install
COPY Web/ .
# Set environment variable to use same origin for API
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Build the Backend (.NET)
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build-api
WORKDIR /src
COPY ["Api/Api.csproj", "Api/"]
COPY ["Application/Application.csproj", "Application/"]
COPY ["Domain/Domain.csproj", "Domain/"]
COPY ["Infrastructure/Infrastructure.csproj", "Infrastructure/"]
RUN dotnet restore "Api/Api.csproj"
COPY . .
WORKDIR "/src/Api"
RUN dotnet build "Api.csproj" -c Release -o /app/build

# Stage 3: Publish the Backend
FROM build-api AS publish-api
RUN dotnet publish "Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final Image (Combine with Nginx)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Copy Frontend artifacts to Nginx's html directory
COPY --from=build-web /app/dist /usr/share/nginx/html

# Copy Backend artifacts
COPY --from=publish-api /app/publish .

# Copy and set up the entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
# Fix potential Windows line ending issues in the script
RUN sed -i 's/\r$//' entrypoint.sh

# Expose port 80 (Nginx)
EXPOSE 80

ENTRYPOINT ["./entrypoint.sh"]
