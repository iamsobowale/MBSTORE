# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (layer-cache friendly)
COPY MBSite.slnx .
COPY src/MBSite.Domain/MBSite.Domain.csproj          src/MBSite.Domain/
COPY src/MBSite.Application/MBSite.Application.csproj src/MBSite.Application/
COPY src/MBSite.Infrastructure/MBSite.Infrastructure.csproj src/MBSite.Infrastructure/
COPY src/MBSite.Api/MBSite.Api.csproj                 src/MBSite.Api/
COPY tests/MBSite.Tests/MBSite.Tests.csproj           tests/MBSite.Tests/
RUN dotnet restore MBSite.slnx

# Build + publish
COPY . .
RUN dotnet publish src/MBSite.Api/MBSite.Api.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Non-root user
RUN addgroup --system mbsite && adduser --system --ingroup mbsite mbsite
USER mbsite

COPY --from=build /app/publish .

# Storage mount-point (uploads directory)
VOLUME ["/app/wwwroot/uploads"]

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "MBSite.Api.dll"]
