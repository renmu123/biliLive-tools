#!/bin/sh

# 启动后端服务
echo "Starting backend service..."
cd /app/backend
node index.cjs server --config config.json &

BACKEND_PID=$!

# 等待后端启动
echo "Waiting for backend to start..."
sleep 3

# 检查后端是否成功启动
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Backend failed to start"
    exit 1
fi

echo "Backend started successfully (PID: $BACKEND_PID)"

# 启动 Caddy
echo "Starting Caddy server..."
caddy run --config /etc/caddy/Caddyfile
