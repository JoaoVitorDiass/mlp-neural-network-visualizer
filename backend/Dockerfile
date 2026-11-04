# ==========================================
# Multi-stage Dockerfile for .NET Backend
# ==========================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy csproj files for cached dependency restore
COPY src/Mlp.Domain/Mlp.Domain.csproj src/Mlp.Domain/
COPY src/Mlp.Application/Mlp.Application.csproj src/Mlp.Application/
COPY src/Mlp.Infrastructure/Mlp.Infrastructure.csproj src/Mlp.Infrastructure/
COPY src/Mlp.Api/Mlp.Api.csproj src/Mlp.Api/

RUN dotnet restore src/Mlp.Api/Mlp.Api.csproj

# Copy remaining source code
COPY src/ src/

# Publish release artifacts
WORKDIR /src/src/Mlp.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Production Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5134
ENV ASPNETCORE_URLS=http://+:5134
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Mlp.Api.dll"]
