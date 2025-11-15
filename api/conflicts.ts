/**
 * Vercel Serverless Function
 * API Route: /api/conflicts
 * Fetches conflicts from Neon PostgreSQL database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to Neon PostgreSQL
    const sql = neon(process.env.DATABASE_URL!);

    // Fetch all curated conflicts (exclude auto-ingested)
    const conflicts = await sql`
      SELECT
        id,
        name,
        start_date as "startDate",
        casualties,
        countries,
        region,
        severity,
        latitude,
        longitude,
        description,
        media_links as "mediaLinks",
        educational_resources as "educationalResources",
        status,
        is_auto_ingested as "isAutoIngested",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM conflicts
      WHERE is_auto_ingested = false
      ORDER BY updated_at DESC
    `;

    // Set cache headers (cache for 10 minutes)
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    return res.status(200).json(conflicts);
  } catch (error) {
    console.error('Database query failed:', error);

    return res.status(500).json({
      error: 'Failed to fetch conflicts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
