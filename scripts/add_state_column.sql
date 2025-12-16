-- SQL script to add 'state' column to properties table and extract states from addresses
-- Run this in Supabase SQL Editor

-- Step 1: Add the state column if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT;

-- Step 2: Update the state column by extracting state from address
-- The address typically ends with the state name (e.g., "Bukit Bintang, Kuala Lumpur, Kuala Lumpur" or "Shah Alam, Selangor")

-- Malaysian States and Federal Territories
-- Kuala Lumpur, Selangor, Penang, Johor, Kedah, Kelantan, Melaka, 
-- Negeri Sembilan, Pahang, Perak, Perlis, Putrajaya, Sabah, Sarawak, Terengganu, Labuan

UPDATE properties
SET state = CASE
    -- Check for exact state matches at the end of address (case insensitive)
    WHEN address ILIKE '%Kuala Lumpur%' THEN 'Kuala Lumpur'
    WHEN address ILIKE '%Selangor%' THEN 'Selangor'
    WHEN address ILIKE '%Penang%' OR address ILIKE '%Pulau Pinang%' THEN 'Penang'
    WHEN address ILIKE '%Johor%' THEN 'Johor'
    WHEN address ILIKE '%Kedah%' THEN 'Kedah'
    WHEN address ILIKE '%Kelantan%' THEN 'Kelantan'
    WHEN address ILIKE '%Melaka%' OR address ILIKE '%Malacca%' THEN 'Melaka'
    WHEN address ILIKE '%Negeri Sembilan%' OR address ILIKE '%N. Sembilan%' THEN 'Negeri Sembilan'
    WHEN address ILIKE '%Pahang%' THEN 'Pahang'
    WHEN address ILIKE '%Perak%' THEN 'Perak'
    WHEN address ILIKE '%Perlis%' THEN 'Perlis'
    WHEN address ILIKE '%Putrajaya%' THEN 'Putrajaya'
    WHEN address ILIKE '%Sabah%' THEN 'Sabah'
    WHEN address ILIKE '%Sarawak%' THEN 'Sarawak'
    WHEN address ILIKE '%Terengganu%' THEN 'Terengganu'
    WHEN address ILIKE '%Labuan%' THEN 'Labuan'
    -- Try to extract from the last part of the address (after last comma)
    ELSE TRIM(SPLIT_PART(address, ',', -1))
END
WHERE state IS NULL OR state = '';

-- Step 3: Create an index for faster state-based queries
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);

-- Step 4: View the results to verify
SELECT state, COUNT(*) as count 
FROM properties 
WHERE state IS NOT NULL 
GROUP BY state 
ORDER BY count DESC;
