#!/bin/sh

# Start the .NET API in the background
dotnet Api.dll &

# Start Nginx in the foreground
nginx -g "daemon off;"
