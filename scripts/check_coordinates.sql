-- Check which properties have valid coordinates
SELECT 
    id,
    property_name,
    address,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NULL THEN 'No coordinates'
        WHEN latitude = -99 THEN 'Failed geocoding'
        ELSE 'Valid coordinates'
    END as status
FROM dup_properties
WHERE latitude IS NOT NULL AND latitude != -99
LIMIT 10;

-- Count properties by coordinate status
SELECT 
    CASE 
        WHEN latitude IS NULL THEN 'No coordinates'
        WHEN latitude = -99 THEN 'Failed geocoding'
        ELSE 'Valid coordinates'
    END as status,
    COUNT(*) as count
FROM dup_properties
GROUP BY status
ORDER BY count DESC;
