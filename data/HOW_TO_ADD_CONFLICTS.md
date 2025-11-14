# How to Add New Curated Conflicts

This guide explains how to add new major conflicts to the conflict tracker.

---

## 🎯 **What are Curated Conflicts?**

Curated conflicts are major, ongoing conflicts that you want to permanently display on the map with accurate historical data. These are:

- **Manually researched** and verified
- **Protected from auto-updates** by the data ingestion system
- **Display proper start dates** (not just recent news dates)
- **Include comprehensive information** (casualties, descriptions, media links)

Examples: Gaza-Israel War, Sudan Civil War, Ukraine-Russia War, etc.

---

## ✅ **Step-by-Step Guide**

### Step 1: Add Conflict to `curated-conflicts.json`

Edit `/data/curated-conflicts.json` and add your new conflict to the array:

```json
{
  "id": "your-conflict-id-2024",
  "name": "Your Conflict Name",
  "startDate": "2024-01-15T00:00:00Z",
  "casualties": 5000,
  "countries": ["Country1", "Country2"],
  "region": "Middle East",
  "severity": "high",
  "latitude": 35.6892,
  "longitude": 51.3890,
  "description": "Detailed description of the conflict. Include who is involved, what sparked it, major events, current status, and humanitarian impact. Aim for 3-5 sentences.",
  "mediaLinks": [
    {
      "type": "article",
      "url": "https://www.bbc.com/news/...",
      "title": "BBC - Conflict Coverage"
    },
    {
      "type": "article",
      "url": "https://www.aljazeera.com/...",
      "title": "Al Jazeera - Coverage"
    }
  ],
  "educationalResources": [
    {
      "title": "UN Report on Conflict",
      "url": "https://www.un.org/..."
    },
    {
      "title": "Human Rights Watch Analysis",
      "url": "https://www.hrw.org/..."
    }
  ],
  "status": "ongoing"
}
```

### Step 2: Add Conflict ID to `curated-ids.json`

Edit `/data/curated-ids.json` and add your conflict ID to the array:

```json
[
  "gaza-israel-2023",
  "sudan-civil-war-2023",
  "your-conflict-id-2024"
]
```

This prevents the auto-ingestion system from overwriting your manually curated data.

### Step 3: Run the Seed Script

```bash
npm run seed
```

This will add your new conflict to the database.

---

## 📋 **Field Reference**

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (use kebab-case) | `"syria-civil-war-2011"` |
| `name` | string | Display name of conflict | `"Syrian Civil War"` |
| `startDate` | ISO date string | When conflict started (not when you added it!) | `"2011-03-15T00:00:00Z"` |
| `casualties` | number | Estimated total casualties | `600000` |
| `countries` | array of strings | Countries involved | `["Syria"]` |
| `region` | string | Geographic region | See regions below |
| `severity` | string | Severity level | `"low"` \| `"medium"` \| `"high"` \| `"critical"` |
| `latitude` | number | Latitude coordinate | `33.5138` |
| `longitude` | number | Longitude coordinate | `36.2765` |
| `description` | string | Detailed description (3-5 sentences) | See examples |
| `mediaLinks` | array of objects | News articles about conflict | See format below |
| `educationalResources` | array of objects | Research/UN reports | See format below |
| `status` | string | Current status | `"ongoing"` \| `"resolved"` \| `"active"` |

### Regions

Choose from:
- `"Africa"`
- `"Asia"`
- `"Eastern Europe"`
- `"Middle East"`
- `"South America"`
- `"Central America"`
- `"North America"`
- `"Oceania"`

### Severity Levels

- **`"critical"`**: 100+ casualties OR genocidal violence OR major humanitarian crisis
- **`"high"`**: 25+ casualties OR significant violence OR regional instability
- **`"medium"`**: 5-25 casualties OR localized violence
- **`"low"`**: <5 casualties OR protests OR minor incidents

### Media Links Format

```json
{
  "type": "article",
  "url": "https://www.bbc.com/news/world-middle-east",
  "title": "BBC - Conflict Name Coverage"
}
```

**Best sources:**
- BBC News
- Al Jazeera
- Reuters
- Associated Press
- Crisis Group
- Local independent journalism

### Educational Resources Format

```json
{
  "title": "UN OCHA - Humanitarian Crisis Report",
  "url": "https://www.unocha.org/..."
}
```

**Best sources:**
- UN agencies (OCHA, OHCHR, UNHCR)
- Human Rights Watch
- Amnesty International
- International Crisis Group
- Academic institutions

---

## 🔍 **How to Research a New Conflict**

### 1. Start Date

- Find the **actual start of major hostilities**, not just recent escalation
- Example: Gaza-Israel War current phase started Oct 7, 2023 (not decades ago)
- Example: Syria Civil War started March 15, 2011 (Arab Spring protests)

**Sources:**
- Wikipedia timeline
- BBC/Al Jazeera retrospectives
- Crisis Group conflict histories

### 2. Casualties

- Use **conservative estimates** from reputable sources
- Prefer UN, WHO, or conflict monitoring organizations over media speculation
- Include both military and civilian casualties
- Update periodically as numbers increase

**Sources:**
- UN reports
- ACLED database
- Syria Observatory, Yemen Data Project (conflict-specific monitors)
- Academic studies

### 3. Location Coordinates

- Use coordinates of the **main conflict zone** or capital city
- For multi-location conflicts, use the most affected area
- Use Google Maps to find lat/long

Example:
```
Gaza City: 31.5, 34.467
Khartoum, Sudan: 15.5007, 32.5599
Kyiv, Ukraine: 50.4501, 30.5234
```

### 4. Description Guidelines

Write a 3-5 sentence description covering:

1. **Who is involved?** (parties to the conflict)
2. **What sparked it?** (triggering event or underlying cause)
3. **Major developments** (key events, turning points)
4. **Current status** (ongoing, ceasefire, resolution attempts)
5. **Humanitarian impact** (displacement, casualties, infrastructure)

**Good example:**
> "Armed conflict between the Sudanese Armed Forces (SAF) led by Abdel Fattah al-Burhan and the paramilitary Rapid Support Forces (RSF) led by Mohamed Hamdan Dagalo. Fighting erupted in Khartoum on April 15, 2023, and spread across Sudan. Resulted in massive displacement (over 6 million people), severe humanitarian crisis, ethnic violence in Darfur, and collapse of state institutions."

**Bad example:**
> "War in Sudan. Many people died. It's still going on."

---

## 🛠️ **Quick Template**

Copy and paste this template, then fill in the details:

```json
{
  "id": "conflict-name-YYYY",
  "name": "Conflict Name",
  "startDate": "YYYY-MM-DDTHH:MM:SSZ",
  "casualties": 0,
  "countries": ["Country"],
  "region": "Region Name",
  "severity": "medium",
  "latitude": 0.0,
  "longitude": 0.0,
  "description": "Who is involved? What sparked it? Major developments? Current status? Humanitarian impact?",
  "mediaLinks": [
    {
      "type": "article",
      "url": "https://www.bbc.com/news/...",
      "title": "BBC - Coverage"
    }
  ],
  "educationalResources": [
    {
      "title": "UN Report",
      "url": "https://www.un.org/..."
    }
  ],
  "status": "ongoing"
}
```

---

## 🔄 **Updating Existing Conflicts**

To update casualty counts or add new media links to existing curated conflicts:

1. Edit the conflict in `/data/curated-conflicts.json`
2. Run `npm run seed` to update the database
3. Changes will be reflected immediately

The auto-ingestion system will **NOT** overwrite your manual updates.

---

## ❓ **FAQ**

### Q: How often should I update casualty counts?

**A:** Update major conflicts monthly or when significant events occur (major battles, massacres, peace agreements).

### Q: Should I add minor conflicts or protests?

**A:** Only add conflicts that meet these criteria:
- At least 5 casualties OR
- Major regional/international significance OR
- Ongoing for 30+ days with sustained violence

### Q: What if I don't know exact casualty numbers?

**A:** Use conservative estimates from:
1. UN agencies
2. ACLED database
3. Local conflict monitors
4. Academic sources

Avoid: Media speculation, partisan sources, unverified claims.

### Q: Can I add historical conflicts (pre-2020)?

**A:** Focus on **current** conflicts (active within last 3-5 years). For historical conflicts:
- Only if they're **still ongoing** (e.g., Syria 2011-present)
- Not if they're **fully resolved** (e.g., Rwandan Genocide 1994)

### Q: What's the difference between curated and auto-ingested conflicts?

| Curated Conflicts | Auto-Ingested Conflicts |
|-------------------|-------------------------|
| Manually researched | Automatically fetched from APIs |
| Historical start dates | Recent news dates only |
| Protected from auto-updates | Auto-updated daily |
| Major ongoing conflicts | Recent incidents/breaking news |
| Comprehensive data | Basic data from news |

---

## 📚 **Recommended Research Sources**

### Conflict Data & Monitoring
- **ACLED** (Armed Conflict Location & Event Data): https://acleddata.com
- **Uppsala Conflict Data Program**: https://ucdp.uu.se/
- **Peace Research Institute Oslo**: https://www.prio.org/

### Humanitarian Organizations
- **UN OCHA**: https://www.unocha.org/
- **UNHCR**: https://www.unhcr.org/
- **ICRC**: https://www.icrc.org/

### Human Rights
- **Human Rights Watch**: https://www.hrw.org/
- **Amnesty International**: https://www.amnesty.org/
- **UN Human Rights**: https://www.ohchr.org/

### News & Analysis
- **International Crisis Group**: https://www.crisisgroup.org/
- **BBC World**: https://www.bbc.com/news/world
- **Al Jazeera**: https://www.aljazeera.com/
- **Reuters**: https://www.reuters.com/

---

## 🎯 **Examples of Well-Formatted Conflicts**

Check these examples in `/data/curated-conflicts.json`:
- `gaza-israel-2023` - Current high-profile conflict
- `ukraine-russia-war-2022` - Multi-year ongoing war
- `syria-civil-war-2011` - Long-running complex conflict
- `nagorno-karabakh-2023` - Recent resolved conflict

---

**Last Updated:** 2025-11-14
**Questions?** Open an issue or check the documentation.
