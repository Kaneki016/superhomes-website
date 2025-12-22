# Geocoding Management Reference

This document provides SQL queries and commands for managing geocoded properties in SuperHomes.

---

## 📊 Check Geocoding Status

### Count Properties by Status

```sql
-- Get breakdown of all properties by geocoding status
SELECT 
    CASE 
        WHEN latitude IS NULL THEN 'Not yet geocoded'
        WHEN latitude = -99 THEN 'Failed geocoding'
        ELSE 'Successfully geocoded'
    END as status,
    COUNT(*) as count
FROM dup_properties
GROUP BY status
ORDER BY count DESC;
```

**Example output:**
```
Not yet geocoded      | 5,234
Successfully geocoded |   859
Failed geocoding      |   916
```

---

## 🔍 View Failed Properties

### See All Failed Geocoding Attempts

```sql
-- List properties that failed geocoding (marked with -99)
SELECT 
    id,
    property_name,
    address,
    state,
    latitude,
    longitude
FROM dup_properties
WHERE latitude = -99
ORDER BY property_name
LIMIT 100;
```

### Export Failed Properties to CSV

1. Run the query above in Supabase SQL Editor
2. Click **"Download as CSV"** button
3. Use the CSV to manually fix addresses or add coordinates

---

## ✅ View Successfully Geocoded Properties

```sql
-- List properties with valid coordinates
SELECT 
    id,
    property_name,
    address,
    latitude,
    longitude
FROM dup_properties
WHERE latitude IS NOT NULL 
  AND latitude != -99
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🔄 Run Geocoding Script

### Geocode New/Unprocessed Properties

```bash
npx tsx scripts/geocode_properties.ts
```

**What it does:**
- Processes properties where `latitude IS NULL`
- Skips already geocoded properties
- Skips failed properties (marked `-99`)
- Rate limited: 1 request per second
- Shows progress and summary

**Expected output:**
```
🗺️  Starting property geocoding...
📍 Found 1000 properties to geocode

[1/1000] Geocoding: Property Name
   ✅ Success: 3.1234, 101.5678

📊 Geocoding Summary
✅ Successfully geocoded: 316
❌ Failed to geocode: 684
📍 Total processed: 1000
```

---

## 🛠️ Manual Fixes

### Reset Failed Property to Retry

If you've fixed an address and want to retry geocoding:

```sql
-- Reset a specific property to retry geocoding
UPDATE dup_properties
SET latitude = NULL, longitude = NULL
WHERE id = 'property-id-here';
```

### Manually Add Coordinates

If you know the exact coordinates (from Google Maps):

```sql
-- Manually set coordinates for a property
UPDATE dup_properties
SET 
    latitude = 3.1234,  -- Replace with actual latitude
    longitude = 101.5678  -- Replace with actual longitude
WHERE id = 'property-id-here';
```

**To get coordinates from Google Maps:**
1. Search for the address on Google Maps
2. Right-click the location → "What's here?"
3. Copy the coordinates (format: `3.1234, 101.5678`)
4. Use in UPDATE statement above

---

## 📈 View Geocoding Statistics

### Properties by State (with coordinates)

```sql
-- Count geocoded properties by state
SELECT 
    state,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN latitude IS NOT NULL AND latitude != -99 THEN 1 END) as geocoded,
    COUNT(CASE WHEN latitude = -99 THEN 1 END) as failed,
    COUNT(CASE WHEN latitude IS NULL THEN 1 END) as pending
FROM dup_properties
WHERE state IS NOT NULL
GROUP BY state
ORDER BY total_properties DESC;
```

### Geocoding Success Rate

```sql
-- Calculate overall success rate
SELECT 
    ROUND((COUNT(CASE WHEN latitude IS NOT NULL AND latitude != -99 THEN 1 END) * 100.0 / COUNT(*)), 2) as success_rate_percent,
    COUNT(CASE WHEN latitude IS NOT NULL AND latitude != -99 THEN 1 END) as successful,
    COUNT(CASE WHEN latitude = -99 THEN 1 END) as failed,
    COUNT(*) as total
FROM dup_properties;
```

---

## 🗺️ Test Map Display

### Find Properties with Coordinates in Specific Area

```sql
-- Find properties with coordinates in Kuala Lumpur
SELECT 
    id,
    property_name,
    address,
    latitude,
    longitude
FROM dup_properties
WHERE latitude IS NOT NULL 
  AND latitude != -99
  AND address ILIKE '%Kuala Lumpur%'
ORDER BY created_at DESC
LIMIT 20;
```

**Then test by visiting:**
`http://localhost:3000/properties/[property-id]`

Scroll down to see the Location map!

---

## 🔧 Troubleshooting

### Script Shows "No properties to geocode" but you have NULL properties

**Problem:** Query limit (1000 properties/batch)

**Solution:** Run the script multiple times. Each run processes the next 1000.

### Script Keeps Retrying Same Failed Properties

**Problem:** Failed properties not being marked with `-99`

**Check:**
```sql
SELECT COUNT(*) FROM dup_properties WHERE latitude = -99;
```

If count is 0, the script isn't marking failures properly. Check script for errors.

### Map Not Showing on Property Page

**Verify property has valid coordinates:**
```sql
SELECT latitude, longitude 
FROM dup_properties 
WHERE id = 'property-id-here';
```

Should return numbers like `3.1234` and `101.5678`, NOT `-99` or `NULL`.

---

## 📝 Quick Reference

| Status | Database Value | Meaning |
|--------|---------------|---------|
| **Not geocoded** | `latitude IS NULL` | Not processed yet |
| **Successfully geocoded** | `latitude = 3.1234` | Valid coordinates |
| **Failed geocoding** | `latitude = -99` | Address couldn't be geocoded |

**Script location:** `scripts/geocode_properties.ts`

**Map components:**
- `components/SinglePropertyMap.tsx` - Individual property maps
- `components/PropertyMap.tsx` - Properties page map view

**Database columns:**
- `latitude` - DECIMAL(10,8), can hold -99.99 to 99.99
- `longitude` - DECIMAL(11,8), can hold -999.99 to 999.99
