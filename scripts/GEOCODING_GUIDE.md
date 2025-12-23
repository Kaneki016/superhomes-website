# 🗺️ Property Geocoding Guide

This guide explains how to use the enhanced geocoding script to add latitude and longitude coordinates to your properties.

## 🎯 Overview

The geocoding script uses a **dual-strategy approach** for maximum success:

1. **Nominatim (OpenStreetMap)** - Free, no API key needed
2. **Google Maps Geocoding API** - Automatic fallback for better accuracy

## 📋 Prerequisites

1. ✅ Supabase credentials in `.env.local`
2. ✅ Google Maps API key in `.env.local` (optional but recommended)

### Setting up Google Maps API

Add to your `.env.local`:
```env
GOOGLE_MAPS_API_KEY=AIzaSyD-your-actual-key-here
```

## 🚀 Usage

### 1. Geocode New Properties (NULL coordinates)
```bash
npx tsx scripts/geocode_properties.ts
```

This will:
- Process all properties with `latitude = NULL`
- Try Nominatim first (free)
- Fall back to Google Maps if Nominatim fails
- Mark as `-99` if both services fail

### 2. Retry Failed Properties (-99 coordinates)
```bash
npx tsx scripts/geocode_properties.ts --retry-failed
```

This will:
- Re-process all properties with `latitude = -99`
- Useful if addresses were updated or services had issues

## 📊 Understanding the Output

### Success Messages
```
✅ Success [Nominatim]: 3.1390, 101.6869
```
- Shows which service successfully geocoded
- Displays latitude and longitude

```
✅ Success [Google Maps]: 3.0738, 101.5183
```
- Google Maps was used as fallback
- Higher accuracy for complex addresses

### Failure Messages
```
⚠️ No results from any service for: Address, State, Malaysia
```
- Both services couldn't find coordinates
- Property will be marked as `-99`

## 🔍 Checking Geocoding Status

Run this SQL query in Supabase:

```sql
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
```

## 💡 Tips for Better Results

### 1. Clean Up Addresses
Before geocoding, ensure addresses are clean:
- Remove extra spaces
- Fix typos
- Add state information if missing

### 2. Use --retry-failed Sparingly
- Only retry after improving address quality
- Or if you suspect temporary API issues

### 3. Monitor API Usage
- Google Maps: 40,000 free requests/month
- Check usage in Google Cloud Console
- Nominatim has no limits but requests rate limiting

## 🛠️ Troubleshooting

### "No coordinates" after running script
- Check if properties have NULL or -99 coordinates
- Use `--retry-failed` flag for -99 properties
- Verify addresses are valid

### Google Maps API not working
- Check API key is correct in `.env.local`
- Ensure Geocoding API is enabled in Google Cloud
- Verify billing is set up (won't charge in free tier)

### Still getting -99 for some properties
- Address may be too vague or incorrect
- Consider manual geocoding for these
- Or improve address data quality

## 📈 Success Rate

Typical success rates:
- **Nominatim only**: 60-70%
- **With Google Maps fallback**: 85-95%
- **Manual intervention needed**: 5-15%

## 🔐 Security Notes

- Never commit `.env.local` to git
- Restrict your Google Maps API key
- Monitor API usage to avoid unexpected charges
