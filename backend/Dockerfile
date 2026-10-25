# ========================================================
# Stage 1: Build & Publish .NET 10 Web API
# ========================================================
ARG DOTNET_VERSION=10.0-preview
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Sao chép các file định nghĩa dự án .csproj để tối ưu cache tầng restore
COPY ["src/Ecommerce.Common/Ecommerce.Common.csproj", "src/Ecommerce.Common/"]
COPY ["src/Ecommerce.DAL/Ecommerce.DAL.csproj", "src/Ecommerce.DAL/"]
COPY ["src/Ecommerce.BLL/Ecommerce.BLL.csproj", "src/Ecommerce.BLL/"]
COPY ["src/Ecommerce.API/Ecommerce.API.csproj", "src/Ecommerce.API/"]

RUN dotnet restore "src/Ecommerce.API/Ecommerce.API.csproj"

# Sao chép toàn bộ mã nguồn và đóng gói Release bundle
COPY . .
WORKDIR "/src/src/Ecommerce.API"
RUN dotnet publish "Ecommerce.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ========================================================
# Stage 2: Runtime Image tinh gọn
# ========================================================
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Tạo thư mục dữ liệu cho CSDL SQLite
RUN mkdir -p /app/data

ENTRYPOINT ["dotnet", "Ecommerce.API.dll"]
