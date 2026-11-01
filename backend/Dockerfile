# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore
COPY ["BankSphere.Domain/BankSphere.Domain.csproj", "BankSphere.Domain/"]
COPY ["BankSphere.Application/BankSphere.Application.csproj", "BankSphere.Application/"]
COPY ["BankSphere.Infrastructure/BankSphere.Infrastructure.csproj", "BankSphere.Infrastructure/"]
COPY ["BankSphere.API/BankSphere.API.csproj", "BankSphere.API/"]
COPY ["BankSphere.sln", "./"]

RUN dotnet restore "BankSphere.API/BankSphere.API.csproj"

# Copy source and publish
COPY . .
WORKDIR "/src/BankSphere.API"
RUN dotnet publish "BankSphere.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BankSphere.API.dll"]
