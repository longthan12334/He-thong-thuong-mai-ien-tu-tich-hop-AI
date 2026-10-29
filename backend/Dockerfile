# ========================================================
# Stage 1: Build .NET 10 Web API (Self-Contained Linux x64)
# ========================================================
FROM ubuntu:24.04 AS build
WORKDIR /src

# Cài đặt công cụ tải và thư viện hệ thống
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libicu74 \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt .NET 10 SDK chính thức từ Microsoft (hoạt động 100% trên mọi nền tảng không kẹt MCR)
RUN curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir /usr/share/dotnet
ENV DOTNET_ROOT=/usr/share/dotnet
ENV PATH=$PATH:/usr/share/dotnet
ENV DOTNET_NOLOGO=true
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1

# Sao chép các file định nghĩa dự án .csproj để tối ưu cache tầng restore
COPY src/Ecommerce.Common/Ecommerce.Common.csproj src/Ecommerce.Common/
COPY src/Ecommerce.DAL/Ecommerce.DAL.csproj src/Ecommerce.DAL/
COPY src/Ecommerce.BLL/Ecommerce.BLL.csproj src/Ecommerce.BLL/
COPY src/Ecommerce.API/Ecommerce.API.csproj src/Ecommerce.API/

RUN dotnet restore src/Ecommerce.API/Ecommerce.API.csproj

# Sao chép toàn bộ mã nguồn và biên dịch Release bundle
COPY . .
WORKDIR /src/src/Ecommerce.API
RUN dotnet publish Ecommerce.API.csproj -c Release -r linux-x64 --self-contained true -o /app/publish /p:UseAppHost=true

# ========================================================
# Stage 2: Runtime Image tinh gọn (Ubuntu 24.04)
# ========================================================
FROM ubuntu:24.04 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libgcc-s1 \
    libicu74 \
    libssl3 \
    libstdc++6 \
    zlib1g \
    curl \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Sao chép tệp thực thi từ tầng build
COPY --from=build /app/publish .
RUN chmod +x /app/Ecommerce.API

# Nạp sẵn CSDL SQLite 27.1MB (273 Seller & 1.600+ Reviews)
RUN mkdir -p /app/data
COPY src/Ecommerce.API/fashion_mall.db /app/data/fashion_mall.db
COPY src/Ecommerce.API/fashion_mall.db /app/fashion_mall.db

ENTRYPOINT ["./Ecommerce.API"]
