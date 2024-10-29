# 使用 Node.js 作为基础镜像
FROM node:20 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# RUN cd packages && ls -al

# 安装目录依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# 构建前端项目
RUN pnpm run build:webui

# 构建后端项目
RUN pnpm run build:cli

# 下载二进制依赖
RUN pnpm run install:bin

# 从另一个基础镜像开始，安装运行时依赖
FROM node:20 AS runtime

# 设置工作目录
WORKDIR /app
RUN mkdir public && mkdir data && mkdir bin

# 复制 backend 代码和 package.json
COPY --from=build /app/packages/app/out/renderer /app/public
COPY --from=build /app/packages/CLI/lib /app
COPY --from=build /app/packages/app/resources/bin /app/bin
COPY --from=build /app/docker ./

ENV NODE_ENV=production

# 安装依赖
RUN npm install

# 暴露 API 端口
EXPOSE 3000

# 启动后端服务器
CMD ["node", "index.cjs", "server"]
