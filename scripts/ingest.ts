#!/usr/bin/env tsx

/**
 * Standalone Data Ingestion Script
 * Fetches conflict data from external sources and updates the database
 * Runs via GitHub Actions cron job (no WebSocket required)
 */

import { DataIngestionService } from '../server/services/ingestion.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🌍 Starting Conflict Data Ingestion');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');

  try {
    // Create ingestion service without WebSocket (null)
    const ingestionService = new DataIngestionService(null);

    // Fetch last 7 days of data
    console.log('📡 Fetching data from external sources...');
    console.log('   Sources: GDELT, RSS feeds, ACLED (if configured)');
    console.log('   Time range: Last 7 days');
    console.log('');

    const results = await ingestionService.ingestRecentData(7);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Ingestion Completed Successfully');
    console.log('='.repeat(60));
    console.log(`   ✨ Conflicts Added:   ${results.added}`);
    console.log(`   🔄 Conflicts Updated: ${results.updated}`);
    console.log(`   ❌ Errors:            ${results.errors}`);
    console.log(`   📊 Data Sources:      ${results.sources.join(', ')}`);
    console.log('='.repeat(60));
    console.log('');

    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ INGESTION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('='.repeat(60));

    // Exit with error code
    process.exit(1);
  }
}

// Run the script
main();
