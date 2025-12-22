-- Add latitude and longitude columns to dup_properties table
-- These will store geocoded coordinates for map display

-- Add latitude column (decimal, nullable initially)
ALTER TABLE dup_properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column (decimal, nullable initially)
ALTER TABLE dup_properties 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries (for future optimization)
CREATE INDEX IF NOT EXISTS idx_dup_properties_coordinates 
ON dup_properties(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN dup_properties.latitude IS 'Property latitude coordinate for map display';
COMMENT ON COLUMN dup_properties.longitude IS 'Property longitude coordinate for map display';

-- Check the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dup_properties' 
  AND column_name IN ('latitude', 'longitude')
ORDER BY ordinal_position;
