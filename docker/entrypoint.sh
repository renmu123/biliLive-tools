#!/bin/sh

# 设置 UMASK（如果指定）
if [ -n "$UMASK" ]; then
    echo "Setting umask to: $UMASK"
    umask "$UMASK"
fi

# 执行传入的命令
exec "$@"
