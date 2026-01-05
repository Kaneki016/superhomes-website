---
description: Future features to implement for SuperHomes
---

# Future Features

## ✅ Completed Features
- [x] 🗺️ Map View (Properties Page) - Leaflet + OpenStreetMap
- [x] 🏫 Nearby Amenities - Shows schools, transit, malls near properties
- [x] ⚡ Performance Optimizations - N+1 fixes, lazy loading, React.memo
- [x] 📊 Property Comparison - Compare up to 3 properties side-by-side

---

## 🔧 Quick Fixes (Identified 2026-01-02)

### 1. 💾 Save Search to Database
**Priority**: High | **Effort**: Medium  
**Location**: `app/properties/page.tsx:304`  
**Issue**: "Save Search" button has a TODO placeholder but no actual implementation.

**Implementation**:
- Save current filter criteria to Supabase `saved_searches` table
- Link to user account
- Add "Saved Searches" section to user profile/dashboard

---

### 2. 🔄 Consolidate Price Formatting Utility
**Priority**: Medium | **Effort**: Low  
**Issue**: `formatPrice` function is duplicated across multiple files:
- `components/PropertyCard.tsx`
- `app/properties/[id]/page.tsx`

**Implementation**:
- Create `lib/utils.ts` with shared `formatPrice` function
- Update all components to use shared utility

---

### 3. 📈 Enhance Comparison Page
**Priority**: Medium | **Effort**: Low  
**Issue**: Comparison feature exists but could show more detailed metrics.

**Implementation**:
- Add PSF comparison
- Add facilities comparison
- Add proximity to amenities comparison
- Add visual price/size charts

---

### 4. ⏳ Loading States Consistency
**Priority**: Low | **Effort**: Medium  
**Issue**: Some pages use skeleton loaders, others don't.

**Implementation**:
- Ensure all listing pages use `PropertyCardSkeleton` or `AgentCardSkeleton`
- Add skeleton to homepage handpicked section
- Add skeleton to similar properties section

---

### 5. 👤 Agent Loading Optimization
**Priority**: Low | **Effort**: Medium  
**Location**: `components/PropertyCard.tsx:38-43`  
**Issue**: Each PropertyCard fetches agent data individually when not provided.

**Implementation**:
- Batch load agents for property lists at parent level
- Pass agent data to PropertyCard to avoid N+1 queries

---

### 6. 🏷️ Land Size Display
**Priority**: Low | **Effort**: Low  
**Issue**: `land_size` field exists in database but may not be displayed everywhere.

**Implementation**:
- Add land size to PropertyCard for landed properties
- Add land size to property detail specifications

---

## 🔥 High Impact - Recommended Next

### 1. 💳 Mortgage Calculator
**Priority**: High | **Effort**: Low  
**Why**: Buyers frequently want to know monthly payments. Increases engagement and time on site.

**Implementation**:
- Simple form: property price, down payment %, interest rate, loan term
- Real-time calculation of monthly payment
- Add to property detail page sidebar

---

### 2. 📊 Property Comparison
**Priority**: High | **Effort**: Medium  
**Why**: Helps users make decisions between 2-3 properties. Very common feature on PropertyGuru.

**Implementation**:
- Add "Compare" button to PropertyCard
- Store up to 3 properties in context/localStorage
- Comparison page with side-by-side table (price, size, PSF, bedrooms, location)

---

### 3. 🔔 Saved Searches with Alerts
**Priority**: Medium | **Effort**: Medium-High  
**Why**: Brings users back to the site. Creates engagement loop.

**Implementation**:
- Save current filter criteria to Supabase
- Daily/weekly email digest of new matching properties
- Requires email service (Resend, SendGrid, or Supabase Edge Functions)

---

## 🌟 Nice to Have

### 4. 🎥 Virtual Tour Integration
**Priority**: Low | **Effort**: Low  
**Why**: Premium feature, but many listings don't have tours yet.

**Implementation**:
- Add `virtual_tour_url` field to properties
- Embed Matterport/YouTube 360 viewers when available

---

### 5. 📈 Price History / Market Trends
**Priority**: Low | **Effort**: High  
**Why**: Valuable but requires historical data collection over time.

**Implementation**:
- Track price changes in separate table
- Show price history chart on property detail
- Area-level trend analytics

---

### 6. 🏠 Similar Properties Algorithm Improvement
**Priority**: Low | **Effort**: Medium  
**Why**: Current implementation uses property_type + state. Could be smarter.

**Implementation**:
- Factor in: price range (±20%), bedroom count, size, distance
- Use PostgreSQL functions for better matching
