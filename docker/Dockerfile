# ============================================
# 基础构建环境
# ============================================
FROM node:24.10 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.2 --activate

WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# 前端构建阶段
# ============================================
FROM base AS frontend-build
ARG VITE_DEFAULT_SERVER=http://127.0.0.1:18010
ARG VITE_FULLSTACK=false
ENV VITE_DEFAULT_SERVER=${VITE_DEFAULT_SERVER}
ENV VITE_FULLSTACK=${VITE_FULLSTACK}
RUN pnpm run build:webui

# ============================================
# 后端构建阶段
# ============================================
FROM base AS backend-build
RUN pnpm run build:base && pnpm run --filter bililive-cli build && cd packages/CLI && node ./scripts/removeDev.js && npm install --force

# 下载二进制依赖
RUN pnpm run install:bin

# 下载字体文件
RUN curl -L -o /usr/local/share/fonts/NotoSansSC-Regular.ttf https://github.com/renmu123/biliLive-tools/releases/download/0.2.1/NotoSansSC-Regular.ttf 

# 下载 https://github.com/qjfoidnh/BaiduPCS-Go 二进制文件
RUN mkdir -p /app/baidu-temp && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        curl -L -o /app/baidu-temp/BaiduPCS-Go.zip https://github.com/qjfoidnh/BaiduPCS-Go/releases/download/v3.9.9/BaiduPCS-Go-v3.9.9-linux-amd64.zip; \
    elif [ "$ARCH" = "aarch64" ]; then \
        curl -L -o /app/baidu-temp/BaiduPCS-Go.zip https://github.com/qjfoidnh/BaiduPCS-Go/releases/download/v3.9.9/BaiduPCS-Go-v3.9.9-linux-arm64.zip; \
    fi && \
    apt-get update && apt-get install -y unzip && \
    unzip /app/baidu-temp/BaiduPCS-Go.zip -d /app/baidu-temp && \
    mv /app/baidu-temp/BaiduPCS-Go-*/BaiduPCS-Go /app/packages/app/resources/bin/BaiduPCS-Go && \
    chmod +x /app/packages/app/resources/bin/BaiduPCS-Go && \
    rm -rf /app/baidu-temp

# 下载 https://github.com/tickstep/aliyunpan 二进制文件
RUN mkdir -p /app/aliyun-temp && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        curl -L -o /app/aliyun-temp/aliyunpan.zip https://github.com/tickstep/aliyunpan/releases/download/v0.3.7/aliyunpan-v0.3.7-linux-amd64.zip; \
    elif [ "$ARCH" = "aarch64" ]; then \
        curl -L -o /app/aliyun-temp/aliyunpan.zip https://github.com/tickstep/aliyunpan/releases/download/v0.3.7/aliyunpan-v0.3.7-linux-arm64.zip; \
    fi && \
    unzip /app/aliyun-temp/aliyunpan.zip -d /app/aliyun-temp && \
    mv /app/aliyun-temp/aliyunpan-*/aliyunpan /app/packages/app/resources/bin/aliyunpan && \
    chmod +x /app/packages/app/resources/bin/aliyunpan && \
    rm -rf /app/aliyun-temp

# ============================================
# 目标1: 纯前端镜像
# ============================================
FROM caddy:latest AS frontend

WORKDIR /app
RUN mkdir public && mkdir data && mkdir bin

COPY --from=frontend-build /app/packages/app/out/renderer /app/public
COPY --from=base /app/docker/Caddyfile ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["caddy", "run", "--config", "/app/Caddyfile"]

# ============================================
# 目标2: 纯后端镜像
# ============================================
FROM node:24.10 AS backend

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libfontconfig1-dev && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir data && mkdir bin && mkdir video

COPY --from=backend-build /app/packages/CLI/lib /app
COPY --from=backend-build /app/packages/CLI/node_modules /app/node_modules
COPY --from=backend-build /app/packages/app/resources/bin /app/bin
COPY --from=backend-build /app/docker/config.json ./
COPY --from=backend-build /usr/local/share/fonts/NotoSansSC-Regular.ttf /usr/share/fonts/NotoSansSC-Regular.ttf

ENV NODE_ENV=production
ENV IS_DOCKER=true
ENV BAIDUPCS_GO_CONFIG_DIR=/app/data
ENV ALIYUNPAN_CONFIG_DIR=/app/data

EXPOSE 18010

CMD ["node", "index.cjs", "server", "--config", "config.json"]

# ============================================
# 目标3: 全栈镜像 (默认)
# ============================================
FROM node:24.10 AS fullstack

WORKDIR /app

# 安装必要的依赖和 Caddy
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libfontconfig1-dev \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https \
    curl && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update && \
    apt-get install -y caddy && \
    rm -rf /var/lib/apt/lists/*

# 创建必要的目录
RUN mkdir -p /app/data /app/video /app/bin /app/backend /app/public

# 复制后端
COPY --from=backend-build /app/packages/CLI/lib /app/backend
COPY --from=backend-build /app/packages/CLI/node_modules /app/backend/node_modules
COPY --from=backend-build /app/packages/app/resources/bin /app/bin
COPY --from=backend-build /usr/local/share/fonts/NotoSansSC-Regular.ttf /usr/share/fonts/NotoSansSC-Regular.ttf

# 复制前端 (使用全栈模式构建的前端)
COPY --from=frontend-build /app/packages/app/out/renderer /app/public

# 复制配置文件
COPY --from=base /app/docker/config.json /app/backend/config.json
COPY --from=base /app/docker/fullstack-Caddyfile /etc/caddy/Caddyfile
COPY --from=base /app/docker/start.sh /app/start.sh

RUN chmod +x /app/start.sh

ENV NODE_ENV=production
ENV IS_DOCKER=true
ENV BAIDUPCS_GO_CONFIG_DIR=/app/data
ENV ALIYUNPAN_CONFIG_DIR=/app/data
ENV TZ=Asia/Shanghai

EXPOSE 3000

CMD ["/app/start.sh"]
