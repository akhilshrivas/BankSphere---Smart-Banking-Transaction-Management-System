# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["backend/BankSphere.Domain/BankSphere.Domain.csproj", "backend/BankSphere.Domain/"]
COPY ["backend/BankSphere.Application/BankSphere.Application.csproj", "backend/BankSphere.Application/"]
COPY ["backend/BankSphere.Infrastructure/BankSphere.Infrastructure.csproj", "backend/BankSphere.Infrastructure/"]
COPY ["backend/BankSphere.API/BankSphere.API.csproj", "backend/BankSphere.API/"]
COPY ["backend/BankSphere.sln", "backend/"]

RUN dotnet restore "backend/BankSphere.API/BankSphere.API.csproj"

COPY backend/ backend/
WORKDIR "/src/backend/BankSphere.API"
RUN dotnet publish "BankSphere.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BankSphere.API.dll"]
