# ========================================================
# Backend Web API (.NET 10 - Self-Contained Linux x64)
# ========================================================
FROM ubuntu:24.04 AS final
WORKDIR /app

# Cài đặt thư viện hệ thống cần thiết cho .NET Core và curl cho healthcheck
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

# Sao chép các tệp đã build self-contained
COPY publish_linux/ /app/

# Đảm bảo quyền thực thi cho binary
RUN chmod +x /app/Ecommerce.API

# Tạo thư mục dữ liệu và nạp sẵn CSDL SQLite 27.1MB (273 Seller & 1.600+ Reviews)
RUN mkdir -p /app/data
COPY src/Ecommerce.API/fashion_mall.db /app/data/fashion_mall.db
COPY src/Ecommerce.API/fashion_mall.db /app/fashion_mall.db

ENTRYPOINT ["./Ecommerce.API"]
