-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('active', 'auth_required', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_notifications table
CREATE TABLE IF NOT EXISTS device_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    status_message TEXT NOT NULL,
    tailscale_url TEXT,
    original_log_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_device_notifications_device_id ON device_notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_device_notifications_timestamp ON device_notifications(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations on device_notifications" ON device_notifications;

-- Create policies to allow all operations for service_role
CREATE POLICY "Allow service_role full access to devices" ON devices FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role full access to device_notifications" ON device_notifications FOR ALL TO service_role USING (true);

-- Create policies to allow read access for anon users (for frontend)
CREATE POLICY "Allow anon read access to devices" ON devices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to device_notifications" ON device_notifications FOR SELECT TO anon USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
