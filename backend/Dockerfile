# ========================================================
# Stage 1: Build .NET 10 Web API
# ========================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Sao chép các file định nghĩa dự án .csproj để tối ưu cache tầng restore
COPY src/Ecommerce.Common/Ecommerce.Common.csproj src/Ecommerce.Common/
COPY src/Ecommerce.DAL/Ecommerce.DAL.csproj src/Ecommerce.DAL/
COPY src/Ecommerce.BLL/Ecommerce.BLL.csproj src/Ecommerce.BLL/
COPY src/Ecommerce.API/Ecommerce.API.csproj src/Ecommerce.API/

RUN dotnet restore src/Ecommerce.API/Ecommerce.API.csproj

# Sao chép toàn bộ mã nguồn và biên dịch Release bundle
COPY . .
WORKDIR /src/src/Ecommerce.API
RUN dotnet publish Ecommerce.API.csproj -c Release -o /app/publish

# ========================================================
# Stage 2: Runtime Image tinh gọn (.NET 10 ASP.NET)
# ========================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Sao chép tệp thực thi từ tầng build
COPY --from=build /app/publish .

# Nạp sẵn CSDL SQLite 27.1MB (273 Seller & 1.600+ Reviews)
RUN mkdir -p /app/data
COPY src/Ecommerce.API/fashion_mall.db /app/data/fashion_mall.db
COPY src/Ecommerce.API/fashion_mall.db /app/fashion_mall.db

ENTRYPOINT ["dotnet", "Ecommerce.API.dll"]
