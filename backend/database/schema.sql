-- Create users table with basic structure first
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if they don't exist (migration-style)
DO $$ 
BEGIN
    -- Add mobile_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mobile_number') THEN
        ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20);
    END IF;
    
    -- Add password_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;
    
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add mobile_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mobile_verified') THEN
        ALTER TABLE users ADD COLUMN mobile_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Make name column NOT NULL if it isn't already
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name' AND is_nullable = 'YES') THEN
        -- First update any NULL names to a default value
        UPDATE users SET name = COALESCE(name, split_part(email, '@', 1)) WHERE name IS NULL OR name = '';
        -- Then set the constraint
        ALTER TABLE users ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Create otps table for email verification
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(otp_code);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

-- Create indexes for new columns (conditional)
DO $$
BEGIN
    -- Create mobile number index if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mobile_number') THEN
        CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);
        CREATE INDEX IF NOT EXISTS idx_users_mobile_verified ON users(mobile_verified);
        -- Create unique constraint for mobile number (allowing NULL)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile_unique ON users(mobile_number) WHERE mobile_number IS NOT NULL;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();