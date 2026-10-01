FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy solution and project files
COPY *.sln ./
COPY src/NguyetnhanPhohien.API/*.csproj src/NguyetnhanPhohien.API/
COPY src/NguyetnhanPhohien.Application/*.csproj src/NguyetnhanPhohien.Application/
COPY src/NguyetnhanPhohien.Common/*.csproj src/NguyetnhanPhohien.Common/
COPY src/NguyetnhanPhohien.Domain/*.csproj src/NguyetnhanPhohien.Domain/
COPY src/NguyetnhanPhohien.Infrastructure/*.csproj src/NguyetnhanPhohien.Infrastructure/

RUN dotnet restore

# Copy all source code
COPY . ./
RUN dotnet publish src/NguyetnhanPhohien.API/NguyetnhanPhohien.API.csproj -c Release -o /out

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /out ./

# Render uses the EXPOSE instruction or PORT environment variable
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "NguyetnhanPhohien.API.dll"]
