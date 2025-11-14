# Conflict Tracker - Project TODOs

## 🎯 **HIGH PRIORITY - Core Functionality**

### 1. Remove Timeline Feature
**Rationale:** Timeline is misleading (shows 1989-2025 but data is only recent days), redundant with filter presets, and adds complexity.

- [ ] Remove `<Timeline>` component from `App.tsx` (line ~281-289)
- [ ] Remove `timelineRange` state variable from `App.tsx` (line ~20)
- [ ] Remove timeline filtering logic from `filteredConflicts` (lines ~83-87)
- [ ] Remove `useEffect` for timeline URL state (lines ~73-77)
- [ ] Update `useURLState` hook to remove timeline parameters
- [ ] Remove `/client/src/components/Timeline.tsx` file
- [ ] Remove GSAP dependency from `package.json` (if only used for timeline)
- [ ] Update FilterPanel to have all date presets ("24h", "Week", "Month", "Year")
- [ ] Test that all filtering still works without timeline
- [ ] Update UI spacing after timeline removal

**Files to modify:**
- `client/src/App.tsx`
- `client/src/hooks/useURLState.ts`
- `client/src/components/Timeline.tsx` (delete)

---

### 2. Implement Featured/Ongoing Conflicts System
**Rationale:** Major conflicts (Ukraine, Gaza, Sudan) need to be highlighted and persistent, not buried in auto-ingested news.

#### 2.1 Database Schema Changes
- [ ] Add `featured` boolean field to conflicts table schema
- [ ] Add `priority` enum field: 'major' | 'standard' | 'minor'
- [ ] Add `autoUpdate` boolean field (allow scheduler to update featured conflicts)
- [ ] Add `category` field: 'war' | 'civil_war' | 'insurgency' | 'border_dispute' | 'terrorism' | 'protest'
- [ ] Add `conflictDuration` calculated field (days since startDate)
- [ ] Run database migration to add new fields
- [ ] Create index on `featured` field for fast queries

**Files to modify:**
- `shared/schema.ts`
- Create new migration script: `scripts/migrations/add-featured-conflicts.sql`

#### 2.2 Curate Major Ongoing Conflicts
- [ ] Create seed data file for major conflicts: `server/data/featured-conflicts.json`
- [ ] Add manually curated major conflicts:
  - [ ] Ukraine-Russia War (2022-present)
  - [ ] Gaza-Israel Conflict (2023-present)
  - [ ] Sudan Civil War (2023-present)
  - [ ] Myanmar Crisis (2021-present)
  - [ ] Tigray Conflict (2020-present)
  - [ ] Yemen Civil War (2014-present)
  - [ ] Syrian Civil War (2011-present)
  - [ ] Afghanistan Taliban Insurgency (2021-present)
  - [ ] Sahel Insurgencies (ongoing)
  - [ ] Colombian Armed Conflict (ongoing)
- [ ] Set `featured: true` and `autoUpdate: true` for these conflicts
- [ ] Ensure high-quality descriptions and educational resources
- [ ] Add reliable media sources for each major conflict
- [ ] Create migration script to import featured conflicts

**Files to create:**
- `server/data/featured-conflicts.json`
- `scripts/seed-featured-conflicts.ts`

#### 2.3 Update Data Ingestion Logic
- [ ] Modify ingestion service to NOT overwrite featured conflicts
- [ ] Update scheduler to refresh casualty counts for featured conflicts
- [ ] Set auto-ingested conflicts to `featured: false` by default
- [ ] Implement conflict matching logic (same location = update existing)
- [ ] Add priority calculation algorithm for auto-ingested conflicts
- [ ] Filter out minor incidents (< 5 casualties unless significant)
- [ ] Prevent duplicate conflicts from different sources

**Files to modify:**
- `server/services/ingestion.ts`
- `server/services/scheduler.ts`

#### 2.4 Update Frontend UI
- [ ] Create "Featured Conflicts" section at top of page
- [ ] Show featured conflicts in separate card grid/list
- [ ] Add "Recent Developments" section for auto-ingested conflicts
- [ ] Update map to show featured conflicts with different marker style (star icon? larger size?)
- [ ] Add filter toggle: "Show only featured" vs "Show all"
- [ ] Update sidebar to show "Featured" badge for major conflicts
- [ ] Ensure featured conflicts always visible (not filtered out)
- [ ] Add conflict duration indicator ("Active for X days")

**Files to modify:**
- `client/src/App.tsx`
- `client/src/components/MapboxGlobe.tsx`
- `client/src/components/ConflictSidebar.tsx`
- Create: `client/src/components/FeaturedConflicts.tsx`

---

### 3. Fix Scheduler Time-Based Execution
**Rationale:** Current scheduler runs on server uptime, not actual clock time. Need true cron-like scheduling.

- [ ] Install `node-cron` or `cron` library
- [ ] Replace `setInterval` with cron expressions
- [ ] Set daily ingestion to run at 2:00 AM UTC (or configurable time)
- [ ] Set hourly checks to run at :00 of each hour
- [ ] Add timezone configuration via environment variable
- [ ] Log next scheduled run time on startup
- [ ] Handle server restart gracefully (catch up on missed runs if needed)
- [ ] Add `/api/admin/scheduler/status` endpoint to show next run times

**Files to modify:**
- `server/services/scheduler.ts`
- `package.json` (add cron dependency)

---

## 🚀 **DEPLOYMENT & INFRASTRUCTURE**

### 4. Production Deployment Strategy
**Rationale:** Need clear deployment process for production environment.

#### 4.1 Database Setup
- [ ] Document required environment variables in `DATABASE_SETUP.md`
- [ ] Create production database on Neon/Supabase/Railway
- [ ] Set up database backups (daily snapshots)
- [ ] Create database migration workflow
- [ ] Add health check endpoint for database connection
- [ ] Document database restore procedure

**Files to modify:**
- `DATABASE_SETUP.md`
- Create: `scripts/backup-database.sh`
- Create: `scripts/restore-database.sh`

#### 4.2 Hosting Platform
- [ ] Choose deployment platform:
  - [ ] Option A: Replit (current, easy but limited)
  - [ ] Option B: Railway.app (recommended for Node.js)
  - [ ] Option C: Render.com
  - [ ] Option D: DigitalOcean App Platform
  - [ ] Option E: AWS ECS/Fargate (more complex)
- [ ] Set up production environment on chosen platform
- [ ] Configure environment variables
- [ ] Set up automatic deployments from `main` branch
- [ ] Configure health checks and uptime monitoring
- [ ] Set up logging/monitoring (e.g., LogRocket, Sentry)

#### 4.3 CI/CD Pipeline
- [ ] Create GitHub Actions workflow for automated testing
- [ ] Add build step in CI pipeline
- [ ] Add linting step (ESLint)
- [ ] Add type checking step (TypeScript)
- [ ] Optional: Add automated database migrations on deploy
- [ ] Set up deployment notifications (Discord/Slack webhook)
- [ ] Document deployment process in `DEPLOYMENT.md`

**Files to create:**
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `DEPLOYMENT.md`

---

### 5. Data Persistence & Historical Data
**Rationale:** Need strategy for historical conflicts and data retention.

- [ ] Decide on historical data approach:
  - [ ] Option A: Manual curation of historical conflicts (1989-2025)
  - [ ] Option B: Focus only on recent/ongoing conflicts
  - [ ] Option C: Import from ACLED historical dataset (requires API key + processing)
- [ ] If manual curation: Create `historical-conflicts.json` seed file
- [ ] Implement data retention policy:
  - [ ] Keep featured conflicts forever
  - [ ] Keep auto-ingested conflicts for 90 days
  - [ ] Archive old conflicts to separate table
- [ ] Create cleanup script to remove stale auto-ingested conflicts
- [ ] Add `archivedAt` timestamp field to schema
- [ ] Schedule weekly cleanup job

**Files to create:**
- `server/data/historical-conflicts.json` (optional)
- `server/services/cleanup.ts`
- `scripts/migrations/add-archival-fields.sql`

---

## 📊 **DATA QUALITY & FILTERING**

### 6. Improve Auto-Ingestion Quality
**Rationale:** Prevent low-quality/irrelevant conflicts from cluttering the map.

- [ ] Implement minimum thresholds for auto-ingested conflicts:
  - [ ] Minimum casualties: 5 (configurable)
  - [ ] Minimum article count: 3 sources
  - [ ] Require verified location (lat/long)
- [ ] Add keyword blacklist to filter out non-conflicts:
  - [ ] "sports", "election", "economic", etc.
- [ ] Improve location extraction accuracy:
  - [ ] Use geocoding API for better coordinates
  - [ ] Validate location is within claimed country
- [ ] Add conflict merging logic:
  - [ ] Merge conflicts within 50km radius
  - [ ] Combine casualty counts from same event
- [ ] Add data quality score field (0-100)
- [ ] Only display conflicts with quality score > 50

**Files to modify:**
- `server/services/ingestion.ts`
- `server/services/gdelt.ts`
- `server/services/rss.ts`
- Create: `server/config/ingestion-rules.ts`

---

### 7. Conflict Status Updates
**Rationale:** Need to track when conflicts become inactive/resolved.

- [ ] Add status tracking: 'active' | 'resolved' | 'ongoing' | 'stalemate'
- [ ] Auto-mark conflicts as 'inactive' if no updates for 30 days
- [ ] Add resolution date field
- [ ] Create admin UI to manually update conflict status
- [ ] Add filter option: "Show only active conflicts"
- [ ] Show status badge in sidebar and map tooltip
- [ ] Add "Last updated: X days ago" indicator

**Files to modify:**
- `shared/schema.ts` (add status fields)
- `client/src/components/FilterPanel.tsx`
- `client/src/components/ConflictSidebar.tsx`
- `server/services/ingestion.ts`

---

## 🎨 **UI/UX IMPROVEMENTS**

### 8. Improve Map Visualization
**Rationale:** Differentiate between featured and auto-ingested conflicts visually.

- [ ] Use different marker styles:
  - [ ] Featured conflicts: Star icon, larger size, always visible
  - [ ] Recent conflicts: Circle icon, smaller size
- [ ] Color coding by category (not just severity):
  - [ ] War: Red
  - [ ] Civil War: Orange
  - [ ] Insurgency: Yellow
  - [ ] Border Dispute: Blue
- [ ] Add map layers toggle:
  - [ ] Toggle featured conflicts on/off
  - [ ] Toggle recent conflicts on/off
  - [ ] Toggle conflict categories
- [ ] Add clustering for dense regions (many conflicts close together)
- [ ] Improve mobile map controls
- [ ] Add conflict heat map mode

**Files to modify:**
- `client/src/components/MapboxGlobe.tsx`
- Create: `client/src/lib/map-utils.ts`

---

### 9. Enhanced Filtering & Search
**Rationale:** Better discovery of specific conflicts.

- [ ] Add advanced search filters:
  - [ ] Search by country
  - [ ] Search by date range (calendar picker)
  - [ ] Search by casualty range (slider)
- [ ] Add sorting options:
  - [ ] Most recent
  - [ ] Highest casualties
  - [ ] Longest duration
  - [ ] Alphabetical
- [ ] Save filter presets (local storage)
- [ ] Add "Clear all filters" button
- [ ] Show active filter count badge
- [ ] Improve search performance (debounce input)

**Files to modify:**
- `client/src/components/FilterPanel.tsx`
- `client/src/App.tsx`

---

### 10. Admin Panel Enhancements
**Rationale:** Better control and monitoring for administrators.

- [ ] Add authentication for admin panel (basic auth or JWT)
- [ ] Show ingestion statistics:
  - [ ] Total conflicts in database
  - [ ] Conflicts added today/this week
  - [ ] Failed ingestion attempts
  - [ ] Data source status (GDELT up/down, RSS feeds status)
- [ ] Add manual conflict creation form
- [ ] Add conflict editing interface
- [ ] Add bulk operations (delete old conflicts, re-run geocoding)
- [ ] Show scheduler status and next run times
- [ ] Add logs viewer for recent ingestion runs

**Files to modify:**
- `client/src/components/AdminPanel.tsx`
- Create: `client/src/components/admin/ConflictEditor.tsx`
- Create: `server/routes/admin.ts`

---

## 📈 **ANALYTICS & MONITORING**

### 11. Add Analytics
**Rationale:** Understand user behavior and popular conflicts.

- [ ] Add privacy-friendly analytics (Plausible or Simple Analytics)
- [ ] Track page views and unique visitors
- [ ] Track most viewed conflicts
- [ ] Track filter usage patterns
- [ ] Track export usage (JSON/CSV)
- [ ] Track comparison feature usage
- [ ] Create analytics dashboard in admin panel

**Files to create:**
- `client/src/lib/analytics.ts`
- Integration with chosen analytics service

---

### 12. Error Monitoring & Logging
**Rationale:** Catch and fix issues in production.

- [ ] Add error tracking (Sentry or similar)
- [ ] Log all API errors with context
- [ ] Track WebSocket disconnections
- [ ] Monitor data ingestion failures
- [ ] Set up alerts for critical errors
- [ ] Create error reporting UI for users
- [ ] Add request ID tracking for debugging

**Files to modify:**
- `server/index.ts`
- Create: `server/lib/logger.ts`

---

## 🧪 **TESTING & QUALITY**

### 13. Add Testing
**Rationale:** Ensure code quality and prevent regressions.

- [ ] Set up testing framework (Vitest or Jest)
- [ ] Add unit tests for ingestion service
- [ ] Add unit tests for data filtering
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests for critical user flows (Playwright)
- [ ] Add tests for conflict merging logic
- [ ] Set up test coverage reporting
- [ ] Add tests to CI pipeline

**Files to create:**
- `server/services/__tests__/ingestion.test.ts`
- `server/services/__tests__/scheduler.test.ts`
- `client/src/__tests__/App.test.tsx`
- `vitest.config.ts`

---

### 14. Code Quality Improvements
**Rationale:** Maintain clean, consistent codebase.

- [ ] Set up ESLint with strict rules
- [ ] Set up Prettier for code formatting
- [ ] Add pre-commit hooks (Husky + lint-staged)
- [ ] Fix all TypeScript `any` types
- [ ] Add JSDoc comments to public functions
- [ ] Refactor large components into smaller pieces
- [ ] Extract magic numbers to constants
- [ ] Add proper error handling everywhere

**Files to create:**
- `.eslintrc.json`
- `.prettierrc`
- `.husky/pre-commit`

---

## 📚 **DOCUMENTATION**

### 15. Improve Documentation
**Rationale:** Help future developers and users understand the system.

- [ ] Create comprehensive README.md:
  - [ ] Project overview
  - [ ] Features list
  - [ ] Installation instructions
  - [ ] Development setup
  - [ ] Deployment guide
  - [ ] Environment variables documentation
  - [ ] API documentation
- [ ] Update DATA_SOURCES.md with latest source info
- [ ] Create ARCHITECTURE.md explaining system design
- [ ] Add inline code comments for complex logic
- [ ] Create user guide (how to use the app)
- [ ] Document database schema with diagrams
- [ ] Create troubleshooting guide

**Files to create/update:**
- `README.md`
- `ARCHITECTURE.md`
- `docs/USER_GUIDE.md`
- `docs/API.md`
- `docs/TROUBLESHOOTING.md`

---

## 🔒 **SECURITY**

### 16. Security Hardening
**Rationale:** Protect against common vulnerabilities.

- [ ] Add rate limiting to API endpoints
- [ ] Add CORS configuration
- [ ] Sanitize user inputs (search queries)
- [ ] Add helmet.js for security headers
- [ ] Implement CSP (Content Security Policy)
- [ ] Add authentication for admin endpoints
- [ ] Rotate and secure API keys (Mapbox, ACLED)
- [ ] Set up HTTPS in production
- [ ] Add request validation with Zod
- [ ] Regular dependency updates (Dependabot)

**Files to modify:**
- `server/index.ts`
- Create: `server/middleware/security.ts`

---

## 🎁 **NICE-TO-HAVE FEATURES**

### 17. Additional Features (Lower Priority)
- [ ] Email notifications for new featured conflicts
- [ ] RSS feed for conflict updates
- [ ] Dark mode toggle
- [ ] Multiple language support (i18n)
- [ ] Conflict comparison charts (casualties over time)
- [ ] Social media sharing (pre-filled tweets with conflict info)
- [ ] Embed widget for other websites
- [ ] Mobile app (React Native)
- [ ] Historical timeline view (replace current timeline with better UX)
- [ ] Conflict predictions using ML (very advanced)

---

## 🏁 **IMPLEMENTATION ORDER**

### Phase 1: Critical Fixes (Week 1)
1. Remove timeline feature (#1)
2. Implement featured conflicts system (#2)
3. Fix scheduler time-based execution (#3)

### Phase 2: Production Ready (Week 2-3)
4. Deployment setup (#4)
5. Data persistence strategy (#5)
6. Improve auto-ingestion quality (#6)

### Phase 3: Polish & Quality (Week 4)
7. Conflict status updates (#7)
8. UI/UX improvements (#8-9)
9. Admin panel enhancements (#10)

### Phase 4: Monitoring & Testing (Week 5)
11. Analytics (#11)
12. Error monitoring (#12)
13. Testing (#13)

### Phase 5: Long-term (Ongoing)
14. Code quality (#14)
15. Documentation (#15)
16. Security (#16)
17. Nice-to-have features (#17)

---

## 📞 **QUESTIONS TO ANSWER BEFORE STARTING**

### Critical Decisions Needed:

1. **Historical Data Strategy:**
   - Do you want conflicts from 1989-2025, or just recent/ongoing?
   - If historical: Will you manually curate or import from ACLED?

2. **Deployment Platform:**
   - Replit (easiest, current setup)
   - Railway/Render (better for production)
   - Custom VPS (most control, more work)

3. **Featured Conflicts:**
   - How many featured conflicts should there be? (10-20 recommended)
   - Who can mark conflicts as featured? (admin only? auto-algorithm?)

4. **Auto-Ingestion Filtering:**
   - What's the minimum casualty threshold? (5? 10? 25?)
   - Should we show protests/minor incidents or only armed conflicts?

5. **Data Retention:**
   - How long to keep auto-ingested minor conflicts? (30 days? 90 days? forever?)

6. **Budget:**
   - Any budget for paid services? (Better geocoding, analytics, monitoring)

---

## 🎯 **SUCCESS METRICS**

After implementation, we should measure:
- [ ] Page load time < 3 seconds
- [ ] Map renders all conflicts in < 2 seconds
- [ ] Data ingestion completes in < 5 minutes
- [ ] Zero featured conflicts accidentally deleted
- [ ] < 5% false positives in auto-ingested conflicts
- [ ] Uptime > 99.5%
- [ ] Mobile experience is smooth (60 FPS map)

---

**Generated:** 2025-11-14
**Status:** Ready for Implementation
**Next Step:** Review and prioritize TODOs based on project goals
