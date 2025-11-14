#!/usr/bin/env tsx

/**
 * Fix isAutoIngested Flags in Database
 *
 * This script fixes existing conflicts in the database to correctly set
 * the isAutoIngested flag based on the curated conflict IDs.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { storage } from '../server/storage.js';

async function fixAutoIngestedFlags() {
  console.log('='.repeat(60));
  console.log('🔧 Fixing isAutoIngested Flags');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Load curated conflict IDs
    const curatedIdsPath = join(process.cwd(), 'data', 'curated-ids.json');
    const curatedIdsContent = await readFile(curatedIdsPath, 'utf-8');
    const curatedIds: string[] = JSON.parse(curatedIdsContent);

    console.log(`📂 Loaded ${curatedIds.length} curated conflict IDs`);
    console.log('');

    // Get all conflicts from database
    const allConflicts = await storage.getConflicts();
    console.log(`📊 Found ${allConflicts.length} total conflicts in database`);
    console.log('');

    let curated = 0;
    let autoIngested = 0;
    let errors = 0;

    // Process each conflict
    for (const conflict of allConflicts) {
      try {
        const isCurated = curatedIds.includes(conflict.id);
        const shouldBeAutoIngested = !isCurated;

        // Check if it needs updating
        if (conflict.isAutoIngested !== shouldBeAutoIngested) {
          await storage.updateConflict(conflict.id, {
            isAutoIngested: shouldBeAutoIngested,
          });

          if (shouldBeAutoIngested) {
            console.log(`   🤖 Marked as auto-ingested: ${conflict.name}`);
            autoIngested++;
          } else {
            console.log(`   ✨ Marked as curated: ${conflict.name}`);
            curated++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${conflict.name}:`, error);
        errors++;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Fix Completed');
    console.log('='.repeat(60));
    console.log(`   ✨ Curated conflicts fixed:       ${curated}`);
    console.log(`   🤖 Auto-ingested conflicts fixed: ${autoIngested}`);
    console.log(`   ❌ Errors:                        ${errors}`);
    console.log(`   📊 Total processed:               ${allConflicts.length}`);
    console.log('='.repeat(60));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ FIX FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the fix script
fixAutoIngestedFlags();
