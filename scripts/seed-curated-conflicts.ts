#!/usr/bin/env tsx

/**
 * Seed Database with Curated Conflicts
 * Populates the database with major ongoing conflicts from curated-conflicts.json
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { storage } from '../server/storage.js';
import type { InsertConflict } from '../shared/schema.js';

interface CuratedConflict {
  id: string;
  name: string;
  startDate: string;
  casualties: number;
  countries: string[];
  region: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  description: string;
  mediaLinks: Array<{ type: string; url: string; title: string }>;
  educationalResources: Array<{ title: string; url: string }>;
  status: 'active' | 'resolved' | 'ongoing';
}

async function seedCuratedConflicts() {
  console.log('='.repeat(60));
  console.log('🌍 Seeding Database with Curated Conflicts');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Read curated conflicts JSON
    const filePath = join(process.cwd(), 'data', 'curated-conflicts.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const curatedConflicts: CuratedConflict[] = JSON.parse(fileContent);

    console.log(`📂 Loaded ${curatedConflicts.length} curated conflicts from file`);
    console.log('');

    let added = 0;
    let updated = 0;
    let errors = 0;

    // Process each curated conflict
    for (const conflict of curatedConflicts) {
      try {
        // Check if conflict already exists
        const existing = await storage.getConflict(conflict.id);

        const conflictData: InsertConflict = {
          id: conflict.id,
          name: conflict.name,
          startDate: new Date(conflict.startDate),
          casualties: conflict.casualties,
          countries: conflict.countries,
          region: conflict.region,
          severity: conflict.severity,
          latitude: conflict.latitude,
          longitude: conflict.longitude,
          description: conflict.description,
          mediaLinks: conflict.mediaLinks,
          educationalResources: conflict.educationalResources,
          status: conflict.status,
          isAutoIngested: false, // Explicitly mark as curated (not auto-ingested)
        };

        if (existing) {
          // Update existing conflict
          await storage.updateConflict(conflict.id, conflictData);
          console.log(`   🔄 Updated: ${conflict.name}`);
          updated++;
        } else {
          // Create new conflict
          await storage.createConflict(conflictData);
          console.log(`   ✨ Added: ${conflict.name}`);
          added++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${conflict.name}:`, error);
        errors++;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Seeding Completed');
    console.log('='.repeat(60));
    console.log(`   ✨ Conflicts Added:   ${added}`);
    console.log(`   🔄 Conflicts Updated: ${updated}`);
    console.log(`   ❌ Errors:            ${errors}`);
    console.log(`   📊 Total Processed:   ${curatedConflicts.length}`);
    console.log('='.repeat(60));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ SEEDING FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the seed script
seedCuratedConflicts();
