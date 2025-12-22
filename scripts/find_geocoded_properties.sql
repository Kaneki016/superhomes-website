-- Get 10 properties that have valid coordinates
-- Copy one of these IDs to test the individual map
SELECT 
    id,
    property_name,
    address,
    latitude,
    longitude
FROM dup_properties
WHERE latitude IS NOT NULL 
  AND latitude != -999
ORDER BY created_at DESC
LIMIT 10;
