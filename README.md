# Tailscale Device Monitor

Một hệ thống giám sát thiết bị Tailscale real-time được xây dựng với Next.js và PostgreSQL. Ứng dụng cho phép theo dõi trạng thái thiết bị, quản lý xác thực và cung cấp dashboard trực quan.

## 🚀 Tính năng chính

### 📊 Dashboard Real-time
- **Thống kê trực tiếp**: Hiển thị số lượng thiết bị active, cần xác thực và offline
- **Cập nhật tự động**: Server-Sent Events (SSE) để cập nhật dữ liệu mỗi 30 giây
- **Trạng thái kết nối**: Hiển thị trạng thái kết nối database và nguồn dữ liệu

### 🔍 Quản lý thiết bị
- **Danh sách thiết bị**: Hiển thị tất cả thiết bị với thông tin chi tiết
- **Tìm kiếm và lọc**: Tìm kiếm theo tên thiết bị hoặc serial number, lọc theo trạng thái
- **Phân trang**: Hỗ trợ phân trang cho hiệu suất tốt
- **Xóa thiết bị**: Xóa thiết bị và tất cả thông báo liên quan

### 🔐 Xử lý xác thực Tailscale
- **Auth URL**: Tự động lưu và hiển thị link xác thực Tailscale
- **Trạng thái thiết bị**: Theo dõi 3 trạng thái: active, auth_required, offline
- **Lịch sử thông báo**: Lưu trữ tất cả thông báo từ thiết bị

### 🛡️ Xử lý lỗi và Fallback
- **Graceful degradation**: Ứng dụng hoạt động ngay cả khi database offline
- **Fallback data**: Hiển thị dữ liệu mặc định khi có lỗi
- **Error recovery**: Tự động retry và thông báo lỗi chi tiết

## 🔌 API Documentation

### Base URL
```
https://api.auva.vn
# hoặc local development
http://localhost:3000
```

### Authentication
Tất cả API endpoints yêu cầu API key trong header:
```
x-api-key: your-secret-api-key
```

---

## 📡 API Endpoints

### 1. Device Notifications (Webhook)
**Endpoint chính để nhận thông báo từ script bash**

```http
POST /api/device_notifications
Content-Type: application/json
x-api-key: your-secret-api-key
```

**Request Body:**
```json
{
  "serialNumber": "string",     // Serial number của thiết bị (required)
  "deviceName": "string",       // Tên thiết bị (required)
  "statusMessage": "string",    // Trạng thái: active|auth_required|offline (required)
  "tailscaleURL": "string",     // URL xác thực Tailscale (optional)
  "originalLogMessage": "string" // Log gốc từ Tailscale (optional)
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "uuid",
  "notificationId": "uuid"
}
```

**Curl Example:**
```bash
curl -X POST "https://api.auva.vn/api/device_notifications" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-secret-api-key" \\
  -d '{
    "serialNumber": "RPi001",
    "deviceName": "Raspberry Pi Office",
    "statusMessage": "active",
    "tailscaleURL": null,
    "originalLogMessage": "{\\"BackendState\\":\\"Running\\"}"
  }'
```

---

### 2. Get Devices
**Lấy danh sách thiết bị với phân trang và lọc**

```http
GET /api/devices?page=1&limit=10&status=all&search=
```

**Query Parameters:**
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số thiết bị mỗi trang (default: 10)
- `status` (string): Lọc theo trạng thái (all|active|auth_required|offline)
- `search` (string): Tìm kiếm theo tên thiết bị hoặc serial number

**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "serial_number": "string",
      "device_name": "string",
      "status": "active|auth_required|offline",
      "last_seen": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "notifications": [
        {
          "id": "uuid",
          "device_id": "uuid",
          "status_message": "string",
          "tailscale_url": "string",
          "original_log_message": "string",
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "_status": "live|fallback|error"
}
```

**Curl Example:**
```bash
curl "https://api.auva.vn/api/devices?page=1&limit=5&status=active"
```

---

### 3. Device Statistics
**Lấy thống kê tổng quan về thiết bị**

```http
GET /api/device_stats
```

**Response:**
```json
{
  "total": 100,
  "active": 75,
  "authRequired": 15,
  "offline": 10,
  "_status": "live|fallback|error"
}
```

**Curl Example:**
```bash
curl "https://api.auva.vn/api/device_stats"
```

---

### 4. Delete Device
**Xóa thiết bị và tất cả thông báo liên quan**

```http
DELETE /api/devices/{deviceId}
```

**Response:**
```json
{
  "success": true
}
```

**Curl Example:**
```bash
curl -X DELETE "https://api.auva.vn/api/devices/uuid-here"
```

---

### 5. Real-time Updates (SSE)
**Server-Sent Events để cập nhật thống kê real-time**

```http
GET /api/device_updates_stream
```

**Response Stream:**
```
data: {"timestamp":"2024-01-01T00:00:00Z","stats":{"active":75,"auth_required":15,"offline":10},"_status":"live"}

data: {"timestamp":"2024-01-01T00:00:30Z","stats":{"active":76,"auth_required":14,"offline":10},"_status":"live"}
```

**JavaScript Example:**
```javascript
const eventSource = new EventSource('/api/device_updates_stream');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Stats update:', data.stats);
};
```

---

### 6. Health Check
**Kiểm tra trạng thái hệ thống và database**

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy|unhealthy",
  "database": "connected|disconnected",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "PostgreSQL 15.0"
}
```

---

### 7. Database Test
**Test kết nối database và kiểm tra bảng**

```http
GET /api/test-db
```

**Response:**
```json
{
  "status": "success|error",
  "timestamp": "2024-01-01T00:00:00Z",
  "tables": ["devices", "device_notifications"],
  "deviceCount": 100,
  "message": "Database connection successful"
}
```

---

## 🔧 Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (thiếu required fields)
- `401` - Unauthorized (sai API key)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "_status": "error"
}
```

### Fallback Behavior
Khi database không khả dụng, API sẽ:
- Trả về dữ liệu mặc định thay vì lỗi 500
- Đánh dấu response với `"_status": "fallback"`
- Ghi log lỗi để debug

---

## 🛠️ Setup và Cài đặt

### 1. Environment Variables
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@159.69.15.251:54322/postgres

# API Security
API_SECRET_KEY=your-secret-api-key-here

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=http://159.69.15.251:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Setup
```bash
# Chạy script setup database
node scripts/setup-db.js

# Hoặc chạy SQL script trực tiếp trong Supabase
# Copy nội dung từ sql/init_database.sql
```

### 3. Installation
```bash
# Clone repository
git clone <repository-url>
cd tailscale-monitor

# Install dependencies
npm install

# Setup database
node scripts/setup-db.js

# Start development server
npm run dev
```

### 4. Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

---

## 📱 Client Script (Bash)

### Script cho thiết bị Tailscale
```bash
#!/bin/bash

# Config
API_URL="https://api.auva.vn/api/device_notifications"
API_KEY="your-secret-api-key"
LOG_FILE="/var/log/tailscale.log"
LOCK_FILE="/tmp/tailscale_monitor.lock"

# Prevent multiple instances
if [ -f "$LOCK_FILE" ]; then
  echo "Script is already running. Exiting."
  exit 0
fi
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Get device info
SERIAL=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)
if [ -z "$SERIAL" ]; then
  SERIAL=$(hostname)-$(cat /sys/class/net/eth0/address 2>/dev/null | sed 's/://g' || echo "unknown")
fi
DEVICE_NAME=$(hostname)

# Check Tailscale status
TAILSCALE_STATUS=$(tailscale status --json)
AUTH_URL=$(echo "$TAILSCALE_STATUS" | jq -r '.AuthURL')

# Determine status
if [ -n "$AUTH_URL" ]; then
  STATUS="auth_required"
else
  if tailscale status >/dev/null 2>&1; then
    STATUS="active"
  else
    STATUS="offline"
  fi
fi

# Prepare payload
PAYLOAD=$(jq -n \\
  --arg sn "$SERIAL" \\
  --arg dn "$DEVICE_NAME" \\
  --arg url "$AUTH_URL" \\
  --arg status "$STATUS" \\
  --arg log "$TAILSCALE_STATUS" \\
  '{
    serialNumber: $sn,
    deviceName: $dn,
    statusMessage: $status,
    tailscaleURL: $url,
    originalLogMessage: $log
  }')

# Send to API
RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "$API_URL" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $API_KEY" \\
  -d "$PAYLOAD")

# Extract status code and response body
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "Success! Response: $RESPONSE_BODY"
else
  echo "Error! Status: $HTTP_STATUS, Response: $RESPONSE_BODY"
  echo "$(date): API Error - Status: $HTTP_STATUS, Response: $RESPONSE_BODY" >> "$LOG_FILE"
fi
```

### Cron Job Setup
```bash
# Chạy mỗi 5 phút
*/5 * * * * /path/to/tailscale_monitor.sh

# Chạy mỗi phút (cho monitoring chặt chẽ)
* * * * * /path/to/tailscale_monitor.sh
```

---

## 🔍 Monitoring và Debug

### Logs
- **Application logs**: Console output trong development
- **Database logs**: PostgreSQL logs
- **API logs**: Request/response logs trong browser network tab

### Health Checks
- `GET /api/health` - Kiểm tra trạng thái tổng quan
- `GET /api/test-db` - Kiểm tra kết nối database
- Database Status component trong UI

### Performance
- Connection pooling cho database
- Indexes được tối ưu cho queries
- SSE cho real-time updates thay vì polling
- Fallback data để tránh downtime

---

## 🚀 Roadmap

### Planned Features
- [ ] Email notifications khi thiết bị offline
- [ ] Webhook notifications
- [ ] Device grouping và tagging
- [ ] Historical data và analytics
- [ ] Mobile app companion
- [ ] Multi-tenant support
- [ ] Advanced filtering và search
- [ ] Export data (CSV, JSON)
- [ ] API rate limiting
- [ ] Audit logs

### Technical Improvements
- [ ] Redis caching
- [ ] Database migrations system
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Monitoring với Prometheus/Grafana
- [ ] Error tracking với Sentry

---

## 📞 Support

- **Issues**: Tạo issue trên GitHub repository
- **Documentation**: Xem README.md và API docs
- **Database**: Sử dụng Supabase SQL Editor để debug

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.
