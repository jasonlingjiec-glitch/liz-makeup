#!/bin/bash
cd "$(dirname "$0")"
echo "LIZ MAKE UP 后台启动中…"
(sleep 1.2; open "http://127.0.0.1:4400") &
node admin/server.js
