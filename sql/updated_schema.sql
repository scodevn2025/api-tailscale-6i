-- Xóa bảng cũ nếu tồn tại (cẩn thận với dữ liệu production)
-- DROP TABLE IF EXISTS device_notifications CASCADE;
-- DROP TABLE IF EXISTS devices CASCADE;

-- Tạo bảng devices với các trường mới
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'auth_required', 'offline')),
    
    -- Thông tin phần cứng
    cpuid VARCHAR(255),
    device_id VARCHAR(255),
    mac_address VARCHAR(17),
    
    -- Thông tin video device
    video_device_name VARCHAR(255),
    video_device_secret VARCHAR(255),
    video_product_key VARCHAR(255),
    
    -- Thông tin Tailscale
    tailscale_url TEXT,
    
    -- Timestamps
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng device_notifications để lưu lịch sử
CREATE TABLE IF NOT EXISTS device_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    status_message VARCHAR(50) NOT NULL,
    
    -- Thông tin phần cứng (snapshot tại thời điểm gửi)
    cpuid VARCHAR(255),
    device_id_value VARCHAR(255),
    mac_address VARCHAR(17),
    
    -- Thông tin video device (snapshot)
    video_device_name VARCHAR(255),
    video_device_secret VARCHAR(255),
    video_product_key VARCHAR(255),
    
    -- Thông tin Tailscale
    tailscale_url TEXT,
    original_log_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

CREATE INDEX IF NOT EXISTS idx_device_notifications_device_id ON device_notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_device_notifications_serial ON device_notifications(serial_number);
CREATE INDEX IF NOT EXISTS idx_device_notifications_timestamp ON device_notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_notifications_status ON device_notifications(status_message);

-- Tạo function để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger để tự động update updated_at
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Thêm một số sample data để test
INSERT INTO devices (
    serial_number, device_name, status, cpuid, device_id, mac_address,
    video_device_name, video_device_secret, video_product_key
) VALUES 
(
    'SAMPLE001', 'sample-device-1', 'active', 
    '0c89239400c8100c00003c0000000000', '639057475', '70:C9:32:08:C2:3A',
    'j4xZQYPLF0bn10U5Bh43', '39c554a421f2584672b5b02cbbb6dab0', 'a1408BoU2FI'
),
(
    'SAMPLE002', 'sample-device-2', 'auth_required',
    '0c89239400c8100c00003c0000000001', '639057476', '70:C9:32:08:C2:3B',
    'k5yABCDEF1cn20V6Ch54', '40d665b532g3695783c6c13dcc7ebe1', 'b2519CpV3GJ'
)
ON CONFLICT (serial_number) DO NOTHING;
