# SEO Setup Guide for SuperHomes

This guide explains how to set up and configure SEO features for the SuperHomes website, including Google Search Console integration and sitemap management.

## Table of Contents
- [Sitemap Structure](#sitemap-structure)
- [Google Search Console Setup](#google-search-console-setup)
- [Submitting Sitemaps](#submitting-sitemaps)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Sitemap Structure

SuperHomes uses a **sitemap index** architecture to organize URLs efficiently:

### Main Sitemap Index
- **URL**: `https://superhomes.my/sitemap.xml`
- **Purpose**: Points to all sub-sitemaps

### Sub-Sitemaps

1. **Static Pages** (`/sitemap/static.xml`)
   - Homepage
   - Main category pages (properties, rent, new-projects, agents, about, compare, resources)
   - State-specific property filter pages
   - **Update Frequency**: Daily
   - **Priority**: 0.5 - 1.0

2. **Properties for Sale** (`/sitemap/properties-sale.xml`)
   - All active property listings for sale
   - **Update Frequency**: Weekly
   - **Priority**: 0.8
   - **Limit**: 50,000 URLs

3. **Properties for Rent** (`/sitemap/properties-rent.xml`)
   - All active rental property listings
   - **Update Frequency**: Weekly
   - **Priority**: 0.8
   - **Limit**: 50,000 URLs

4. **New Projects** (`/sitemap/properties-projects.xml`)
   - All active new property projects
   - **Update Frequency**: Weekly
   - **Priority**: 0.8
   - **Limit**: 50,000 URLs

5. **Agents** (`/sitemap/agents.xml`)
   - All agent profile pages
   - **Update Frequency**: Monthly
   - **Priority**: 0.6
   - **Limit**: 10,000 URLs

6. **Resources/Blog** (`/sitemap/resources.xml`)
   - All blog articles and resources
   - **Update Frequency**: Monthly
   - **Priority**: 0.7

### Caching Strategy

All sitemaps include HTTP caching headers for performance:
- **Static pages**: 1 hour cache, 24-hour stale-while-revalidate
- **Property sitemaps**: 1 hour cache, 24-hour stale-while-revalidate
- **Agent sitemap**: 2 hour cache, 24-hour stale-while-revalidate
- **Resources sitemap**: 24 hour cache, 7-day stale-while-revalidate

## Google Search Console Setup

### Step 1: Create/Access GSC Account

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click "Add Property"

### Step 2: Choose Property Type

You have two options:

**Option A: Domain Property** (Recommended)
- Covers all subdomains and protocols (http/https)
- Requires DNS verification
- URL: `superhomes.my`

**Option B: URL Prefix**
- Covers only specific URL
- Multiple verification methods
- URL: `https://superhomes.my`

### Step 3: Verify Ownership

#### Method 1: HTML Meta Tag (Easiest for Next.js)

1. In GSC, select "HTML tag" verification method
2. Copy the verification code (e.g., `google1234567890abcdef`)
3. Add to your `.env.local` file:
   ```bash
   NEXT_PUBLIC_GSC_VERIFICATION_CODE=google1234567890abcdef
   ```
4. Deploy your changes
5. Return to GSC and click "Verify"

#### Method 2: DNS Verification (For Domain Property)

1. In GSC, you'll receive a TXT record
2. Add the TXT record to your domain's DNS settings
3. Wait for DNS propagation (can take up to 48 hours)
4. Return to GSC and click "Verify"

### Step 4: Configure Settings

After verification:

1. **Set Preferred Domain**: Choose `https://superhomes.my` (with https)
2. **Geographic Target**: Set to Malaysia
3. **Crawl Rate**: Leave as default (Google automatically determines)

## Submitting Sitemaps

### Submit Main Sitemap

1. In Google Search Console, go to **Sitemaps** (left sidebar)
2. Enter sitemap URL: `https://superhomes.my/sitemap.xml`
3. Click "Submit"

Google will automatically discover and crawl all sub-sitemaps referenced in the index.

### Verify Submission

After 24-48 hours:
1. Check the Sitemaps page in GSC
2. You should see:
   - Main sitemap with status "Success"
   - All sub-sitemaps discovered
   - Number of URLs discovered vs. indexed

### Troubleshooting

**Issue**: Sitemap not found (404 error)
- **Solution**: Ensure your site is deployed and accessible
- Test locally: `curl https://superhomes.my/sitemap.xml`

**Issue**: Couldn't fetch sitemap
- **Solution**: Check robots.txt allows sitemap access
- Verify sitemap XML is valid

**Issue**: Some URLs not indexed
- **Solution**: This is normal. Google chooses which URLs to index
- Check Coverage report for specific issues

## Monitoring and Maintenance

### Weekly Tasks

1. **Check Coverage Report**
   - Go to GSC → Coverage
   - Review "Valid" vs "Excluded" URLs
   - Investigate any errors

2. **Monitor Performance**
   - GSC → Performance
   - Track clicks, impressions, CTR
   - Identify top-performing pages

### Monthly Tasks

1. **Review Search Queries**
   - Identify new keyword opportunities
   - Check which queries drive traffic

2. **Check Mobile Usability**
   - GSC → Mobile Usability
   - Fix any mobile-specific issues

3. **Analyze Core Web Vitals**
   - GSC → Core Web Vitals
   - Ensure good user experience scores

### Quarterly Tasks

1. **Audit Sitemap Priorities**
   - Review and adjust priority values
   - Update change frequencies if needed

2. **Check for Crawl Errors**
   - GSC → Settings → Crawl Stats
   - Ensure Google can crawl efficiently

3. **Review Manual Actions**
   - GSC → Manual Actions
   - Ensure no penalties applied

## Best Practices

### URL Structure
- ✅ Use descriptive, keyword-rich URLs
- ✅ Keep URLs short and readable
- ✅ Use hyphens to separate words
- ❌ Avoid special characters and parameters

### Meta Tags
- ✅ Unique title for each page (50-60 characters)
- ✅ Compelling meta descriptions (150-160 characters)
- ✅ Include target keywords naturally
- ❌ Don't keyword stuff

### Content
- ✅ Create unique, valuable content
- ✅ Update content regularly
- ✅ Use proper heading hierarchy (H1, H2, H3)
- ❌ Don't duplicate content across pages

### Performance
- ✅ Optimize images (use WebP, lazy loading)
- ✅ Minimize JavaScript and CSS
- ✅ Use CDN for static assets
- ✅ Enable compression (gzip/brotli)

## Additional Search Engines

### Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Verify ownership (similar to GSC)
4. Submit sitemap: `https://superhomes.my/sitemap.xml`

To add Bing verification:
```bash
# .env.local
NEXT_PUBLIC_BING_VERIFICATION_CODE=your-bing-code
```

Then uncomment the Bing line in `app/layout.tsx`:
```typescript
verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION_CODE || '',
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION_CODE,
}
```

## Useful Tools

- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

## Support

For issues or questions:
1. Check [Google Search Central](https://developers.google.com/search)
2. Review [Next.js SEO documentation](https://nextjs.org/learn/seo/introduction-to-seo)
3. Consult the implementation plan in this repository
