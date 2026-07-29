#!/bin/sh

# 设置 UMASK（如果指定）
if [ -n "$UMASK" ]; then
    echo "Setting umask to: $UMASK"
    umask "$UMASK"
fi

# 设置 PUID 和 PGID（如果指定）
PUID=${PUID:-0}
PGID=${PGID:-0}

if [ "$PUID" != "0" ] || [ "$PGID" != "0" ]; then
    echo "Setting up user with PUID=$PUID and PGID=$PGID"
    
    # 创建组（如果不存在）
    if ! getent group "$PGID" > /dev/null 2>&1; then
        groupadd -g "$PGID" appgroup
    fi
    
    # 创建用户（如果不存在）
    if ! getent passwd "$PUID" > /dev/null 2>&1; then
        useradd -u "$PUID" -g "$PGID" -s /bin/sh -M appuser
    fi
    
    # 修改目录权限
    chown -R "$PUID:$PGID" /app/data /app/video 2>/dev/null || true
    
    # 使用 gosu 切换用户执行命令
    exec gosu "$PUID:$PGID" "$@"
else
    # 以 root 用户运行
    exec "$@"
fi
