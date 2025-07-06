/*
  # Complete Fasel Power Database Schema

  1. New Tables
    - `users` - User management with authentication integration
    - `devices` - Device repair tracking with status management
    - `device_images` - Image storage for devices
    - `statistics` - Analytics and reporting data

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for authenticated users
    - Secure data access patterns

  3. Functions
    - Daily income calculation
    - Common issues analytics
    - Common devices analytics
    - Automated triggers for status updates

  4. Indexes
    - Performance optimization for common queries
    - Search and filtering support
*/

-- Drop existing objects if they exist to ensure clean setup
DROP TRIGGER IF EXISTS update_device_delivered_trigger ON devices;
DROP FUNCTION IF EXISTS update_device_delivered_at();
DROP FUNCTION IF EXISTS calculate_daily_income(date);
DROP FUNCTION IF EXISTS get_most_common_issues(integer);
DROP FUNCTION IF EXISTS get_most_common_devices(integer);

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS device_images;
DROP TABLE IF EXISTS statistics;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create devices table
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  issue_description text NOT NULL,
  service_price numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(10,2) GENERATED ALWAYS AS (service_price - amount_paid) STORED,
  serial_number text,
  customer_notes text,
  repair_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'repaired', 'cannot_repair', 'delivered')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  created_by uuid REFERENCES users(id)
);

-- Create device_images table
CREATE TABLE device_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'before_repair',
  created_at timestamptz DEFAULT now()
);

-- Create statistics table
CREATE TABLE statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_type text NOT NULL,
  stat_value numeric(10,2) NOT NULL DEFAULT 0,
  stat_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_created_at ON devices(created_at);
CREATE INDEX idx_devices_customer_phone ON devices(customer_phone);
CREATE INDEX idx_statistics_date ON statistics(stat_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create RLS policies for devices table
CREATE POLICY "Authenticated users can read devices" ON devices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert devices" ON devices
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update devices" ON devices
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete devices" ON devices
  FOR DELETE TO authenticated
  USING (true);

-- Create RLS policies for device_images table
CREATE POLICY "Authenticated users can read device images" ON device_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert device images" ON device_images
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create RLS policies for statistics table
CREATE POLICY "Authenticated users can read statistics" ON statistics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert statistics" ON statistics
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create function to update delivered_at timestamp
CREATE OR REPLACE FUNCTION update_device_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivered_at updates
CREATE TRIGGER update_device_delivered_trigger
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_delivered_at();

-- Create function to calculate daily income
CREATE OR REPLACE FUNCTION calculate_daily_income(target_date date DEFAULT CURRENT_DATE)
RETURNS numeric AS $$
DECLARE
  total_income numeric := 0;
BEGIN
  SELECT COALESCE(SUM(service_price), 0) INTO total_income
  FROM devices
  WHERE status = 'delivered'
    AND DATE(delivered_at) = target_date;
  
  RETURN total_income;
END;
$$ LANGUAGE plpgsql;

-- Create function to get most common issues
CREATE OR REPLACE FUNCTION get_most_common_issues(limit_count integer DEFAULT 10)
RETURNS TABLE (issue text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT issue_description, COUNT(*) as issue_count
  FROM devices
  GROUP BY issue_description
  ORDER BY issue_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get most common devices
CREATE OR REPLACE FUNCTION get_most_common_devices(limit_count integer DEFAULT 10)
RETURNS TABLE (device text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT device_type, COUNT(*) as device_count
  FROM devices
  GROUP BY device_type
  ORDER BY device_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
INSERT INTO users (id, email, full_name, phone, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@faselpower.com', 'مدير النظام', '+966501234567', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample devices for testing
INSERT INTO devices (device_type, customer_name, customer_phone, issue_description, service_price, amount_paid, status, created_by) VALUES
  ('iPhone 14 Pro', 'أحمد محمد', '+966501111111', 'شاشة مكسورة', 500.00, 500.00, 'delivered', '00000000-0000-0000-0000-000000000001'),
  ('Samsung Galaxy S23', 'فاطمة علي', '+966502222222', 'بطارية لا تشحن', 300.00, 150.00, 'repaired', '00000000-0000-0000-0000-000000000001'),
  ('iPhone 13', 'محمد سعد', '+966503333333', 'مشكلة في الصوت', 200.00, 0.00, 'pending', '00000000-0000-0000-0000-000000000001'),
  ('Huawei P50', 'نورا أحمد', '+966504444444', 'لا يشتغل', 400.00, 200.00, 'cannot_repair', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;