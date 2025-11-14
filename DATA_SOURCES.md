# Data Sources Guide

This application aggregates conflict data from multiple trusted sources to provide comprehensive, real-time global conflict tracking.

## Primary Sources (No API Keys Required!)

### 🌍 GDELT (Global Database of Events, Language and Tone)

**What it is:**
- Real-time monitoring of global news media
- Updates every 15 minutes
- Covers events in 100+ languages from sources worldwide
- Completely free, no registration required

**How we use it:**
- Primary data source for real-time conflict events
- Fetches articles tagged with conflict keywords
- Groups articles by location to create meaningful conflict entries
- Calculates severity based on article volume and sentiment

**Coverage:**
- Global coverage
- Real-time to 15-minute delay
- Includes both major and emerging conflicts

**API Documentation:** https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/

---

### 📰 RSS News Feeds

**What it is:**
- Direct feeds from major international news organizations
- Simple, reliable, no API keys needed
- Real-time as news breaks

**Sources we monitor:**
- **Reuters**: Global news agency
- **BBC World**: International coverage
- **Al Jazeera**: Middle East and global focus
- **Crisis Group**: Conflict analysis and prevention

**How we use it:**
- Backup data source for news coverage
- Filters for conflict-related articles
- Extracts location and severity information
- Links directly to original reporting

**Coverage:**
- Global, with strong coverage in conflict zones
- Real-time as articles are published
- Editorial quality from established news organizations

---

## Optional Enhanced Source

### 📊 ACLED (Armed Conflict Location & Event Data Project)

**What it is:**
- Academic database of political violence and protest events
- Manually verified and coded by researchers
- Higher data quality but slower updates

**Why it's optional:**
- Requires free account registration (can take 1-2 days for approval)
- Has rate limits (2,500 requests/day on free tier)
- Updates less frequently than GDELT/RSS
- App works perfectly fine without it

**How we use it (when available):**
- Enhances data quality with verified events
- Provides structured conflict categorization
- Adds academic rigor to conflict data

**Coverage:**
- Global coverage with focus on conflict regions
- Daily updates
- Historical data back to 1997

**API Documentation:** https://apidocs.acleddata.com/

---

## Data Processing Pipeline

```
┌─────────────────────────────────────────────────────┐
│  1. DATA COLLECTION                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  GDELT API              RSS Feeds        ACLED API │
│  (15min updates)        (real-time)     (optional) │
│       │                     │                 │     │
│       └─────────┬───────────┴─────────────────┘     │
│                 ▼                                   │
│         Fetch & Parse Data                          │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  2. DATA TRANSFORMATION                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  - Extract locations (country, coordinates)         │
│  - Detect conflict type                             │
│  - Calculate severity (casualties, event type)      │
│  - Map to standardized regions                      │
│  - Extract media links and sources                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  3. DEDUPLICATION & AGGREGATION                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  - Group by location and actors                     │
│  - Aggregate multiple reports into single conflict  │
│  - Sum casualties from different sources            │
│  - Select most representative event                 │
│  - Combine media links from all sources             │
│                                                     │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  4. STORAGE & UPDATES                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  - Check if conflict already exists in database     │
│  - Update if casualties/severity changed            │
│  - Insert new conflicts                             │
│  - Broadcast changes via WebSocket                  │
│  - Update frontend in real-time                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Data Quality & Verification

### Severity Calculation

We calculate conflict severity using multiple factors:

**From GDELT:**
- Article volume (more coverage = higher severity)
- Sentiment tone (more negative = higher severity)
- Source count (multiple sources = more significant)

**From RSS:**
- Keyword analysis (killed, casualties, etc.)
- Article count on the topic
- Source reputation

**From ACLED (when available):**
- Official event type classification
- Verified casualty counts
- Conflict categorization

### Severity Levels

- **Critical**: 100+ casualties OR major conflict events OR extensive media coverage
- **High**: 25+ casualties OR significant violence OR high media attention
- **Medium**: 5+ casualties OR notable incidents OR moderate coverage
- **Low**: < 5 casualties OR minor incidents OR limited coverage

### Location Accuracy

- **ACLED**: Exact coordinates when available (most accurate)
- **GDELT**: Country-level coordinates
- **RSS**: City/region coordinates based on article analysis
- **Fallback**: Capital city coordinates if exact location unavailable

## Update Frequency

### Automatic Updates

- **Daily Full Ingestion**: Runs every 24 hours, fetches last 7 days of data
- **Hourly Quick Check**: Runs every hour, fetches last 2 hours for breaking news

### Manual Updates

- Click "Fetch Latest Conflicts" in Admin Panel
- Fetches immediately from all configured sources
- Updates appear in real-time on the globe

## Data Limitations & Transparency

### Known Limitations

1. **GDELT/RSS rely on news coverage**: Conflicts in areas with limited press access may be underreported
2. **Location precision varies**: Some conflicts use approximate coordinates
3. **Casualty estimates**: Numbers are aggregated from news reports and may not be fully verified
4. **Lag time**: Most data is 15 minutes to 24 hours old (not instant)
5. **Deduplication imperfect**: The same conflict might appear twice with different names

### What We Don't Do

- ❌ We don't editorialize or add bias
- ❌ We don't verify casualties independently
- ❌ We don't make political judgments about conflicts
- ❌ We don't hide any conflicts based on politics

### Transparency

- All conflicts link back to original sources
- Source attribution shown for each conflict
- Users can click through to verify information
- Open-source code for full transparency

## Adding New Data Sources

Want to add another source? Here's how:

1. Create a new service in `server/services/your-source.ts`
2. Implement methods:
   - `fetchRecentConflicts()` - Get data from API
   - `transformToConflicts()` - Convert to our format
3. Add to ingestion service in `server/services/ingestion.ts`
4. Update this documentation

Examples to consider:
- **Relief Web**: UN humanitarian information
- **Wikipedia Current Events**: Community-curated events
- **News APIs**: NewsAPI, GNews, etc.
- **Government sources**: State Department, UN reports

## Support & Questions

- **GDELT Issues**: Check https://blog.gdeltproject.org/
- **RSS Feed Problems**: Verify feed URLs are accessible
- **ACLED Support**: Contact developer.acleddata.com
- **App Issues**: Check GitHub issues or server logs

---

*Last Updated: 2024*
*Data sources are continuously monitored for availability and reliability*
