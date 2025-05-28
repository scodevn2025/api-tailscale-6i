#!/bin/sh

# === Cấu hình ===
API_URL="https://api.auva.vn/api/device_notifications"
API_KEY="GR1dX0s7eY5JPm9TswL3kZxHrUaVqBQc6iAoNnjpC8gR4OFDIhXbS2MlvWyKTuzE"
FACTORY_DIR="/mnt/private/ULI/factory"
DEBUG_LOG="/var/log/tailscale.log"  # Đường dẫn đến log của Tailscale

# === Đọc thông tin từ file ===
read_file() { [ -f "$1" ] && cat "$1" || echo "Unknown"; }

SERIAL_NUMBER=$(read_file "$FACTORY_DIR/sn.txt")
DEVICE_NAME=$(hostname)
CPUID=$(read_file "$FACTORY_DIR/cpuid.txt")
DEVICE_ID=$(read_file "$FACTORY_DIR/did.txt")
MAC_ADDRESS=$(read_file "$FACTORY_DIR/mac.txt")
VIDEO_NAME=$(read_file "$FACTORY_DIR/video_device_name.txt")
VIDEO_SECRET=$(read_file "$FACTORY_DIR/video_device_secret.txt")
VIDEO_KEY=$(read_file "$FACTORY_DIR/video_product_key.txt")

LOCK_FILE="/tmp/tailscale_api.lock"
LAST_SENT_FILE="/tmp/tailscale_last_sent.txt"
LAST_URL_FILE="/tmp/tailscale_last_url.txt"
RATE_LIMIT=300  # 5 phút

# === Lock tránh chạy song song ===
[ -f "$LOCK_FILE" ] && echo "Script is already running. Exiting." && exit 0
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' INT TERM EXIT

# === Kiểm tra rate limit ===
NOW=$(date +%s)
[ -f "$LAST_SENT_FILE" ] && LAST=$(cat "$LAST_SENT_FILE") && [ $((NOW - LAST)) -lt $RATE_LIMIT ] && echo "Skipped due to rate limit." && exit 0

# === Đọc log Tailscale ===
# Thử nhiều cách để tìm URL xác thực Tailscale
AUTH_URL=""

# Cách 1: Kiểm tra từ log file
if [ -f "$DEBUG_LOG" ]; then
  AUTH_URL=$(grep -o 'https://login.tailscale.com/a/[a-zA-Z0-9]*' "$DEBUG_LOG" | tail -n 1)
  RAW_LOG=$(tr -d '\n\r' < "$DEBUG_LOG" | sed 's/"/\\"/g')
fi

# Cách 2: Kiểm tra từ lệnh tailscale status --json
if [ -z "$AUTH_URL" ]; then
  TAILSCALE_STATUS=$(tailscale status --json 2>/dev/null)
  if [ $? -eq 0 ]; then
    # Trích xuất AuthURL từ JSON output (cần jq hoặc grep)
    if command -v jq >/dev/null 2>&1; then
      AUTH_URL=$(echo "$TAILSCALE_STATUS" | jq -r '.AuthURL // empty')
    else
      AUTH_URL=$(echo "$TAILSCALE_STATUS" | grep -o '"AuthURL":"[^"]*"' | sed 's/"AuthURL":"//;s/"$//')
    fi
    RAW_LOG="$TAILSCALE_STATUS"
  fi
fi

# Cách 3: Kiểm tra từ lệnh tailscale up
if [ -z "$AUTH_URL" ]; then
  TAILSCALE_UP=$(tailscale up 2>&1)
  AUTH_URL=$(echo "$TAILSCALE_UP" | grep -o 'https://login.tailscale.com/a/[a-zA-Z0-9]*')
  RAW_LOG="$TAILSCALE_UP"
fi

# === Xác định trạng thái ===
if [ -n "$AUTH_URL" ]; then
  STATUS="auth_required"
  echo "Found auth URL: $AUTH_URL"
else
  # Kiểm tra xem Tailscale có đang chạy không
  if tailscale status >/dev/null 2>&1; then
    STATUS="active"
    echo "Tailscale is active"
  else
    STATUS="offline"
    echo "Tailscale is offline"
  fi
fi

# === Kiểm tra URL trùng lặp ===
if [ -n "$AUTH_URL" ]; then
  LAST_URL=$(cat "$LAST_URL_FILE" 2>/dev/null)
  if [ "$AUTH_URL" = "$LAST_URL" ] && [ "$STATUS" != "offline" ]; then
    echo "No change in auth URL. Skipping."
    # Vẫn tiếp tục gửi nếu đã quá thời gian rate limit
    [ -f "$LAST_SENT_FILE" ] && LAST=$(cat "$LAST_SENT_FILE") && [ $((NOW - LAST)) -lt 1800 ] && exit 0
  fi
fi

# === Tạo JSON payload ===
JSON="{"
JSON="$JSON\"serialNumber\":\"$SERIAL_NUMBER\""
JSON="$JSON,\"deviceName\":\"$DEVICE_NAME\""
JSON="$JSON,\"statusMessage\":\"$STATUS\""
JSON="$JSON,\"cpuid\":\"$CPUID\""
JSON="$JSON,\"deviceId\":\"$DEVICE_ID\""
JSON="$JSON,\"macAddress\":\"$MAC_ADDRESS\""
JSON="$JSON,\"videoDeviceName\":\"$VIDEO_NAME\""
JSON="$JSON,\"videoDeviceSecret\":\"$VIDEO_SECRET\""
JSON="$JSON,\"videoProductKey\":\"$VIDEO_KEY\""
[ -n "$AUTH_URL" ] && JSON="$JSON,\"tailscaleURL\":\"$AUTH_URL\""
[ -n "$RAW_LOG" ] && JSON="$JSON,\"originalLogMessage\":\"$RAW_LOG\""
JSON="$JSON}"

echo "Sending payload with status: $STATUS"
[ -n "$AUTH_URL" ] && echo "Auth URL: $AUTH_URL"

# === Gửi đến server ===
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$JSON")

BODY=$(echo "$RESPONSE" | sed '$d')
CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$CODE" = "200" ]; then
    echo "$NOW" > "$LAST_SENT_FILE"
    [ -n "$AUTH_URL" ] && echo "$AUTH_URL" > "$LAST_URL_FILE"
    echo "✔ Notification sent to $API_URL"
    echo "$BODY"
else
    echo "✖ Failed to send. Status: $CODE"
    echo "$BODY"
fi
