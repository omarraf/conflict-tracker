import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import { conflicts } from '@shared/schema';

interface LegacyConflict {
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
  mediaLinks: {
    type: 'image' | 'video' | 'article';
    url: string;
    title: string;
  }[];
  educationalResources: {
    title: string;
    url: string;
  }[];
  status: 'active' | 'resolved' | 'ongoing';
}

async function migrateData() {
  console.log('Starting data migration...');

  const jsonPath = path.join(process.cwd(), 'client/src/data/conflicts.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('No conflicts.json found at:', jsonPath);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const legacyConflicts: LegacyConflict[] = JSON.parse(rawData);

  console.log(`Found ${legacyConflicts.length} conflicts to migrate`);

  const db = getDb();

  for (const legacy of legacyConflicts) {
    try {
      await db.insert(conflicts).values({
        id: legacy.id,
        name: legacy.name,
        startDate: new Date(legacy.startDate),
        casualties: legacy.casualties,
        countries: legacy.countries,
        region: legacy.region,
        severity: legacy.severity,
        latitude: legacy.latitude,
        longitude: legacy.longitude,
        description: legacy.description,
        mediaLinks: legacy.mediaLinks,
        educationalResources: legacy.educationalResources,
        status: legacy.status,
      }).onConflictDoNothing();

      console.log(`✓ Migrated: ${legacy.name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${legacy.name}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateData };
