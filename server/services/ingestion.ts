/**
 * Data Ingestion Service
 * Coordinates fetching conflict data from multiple sources,
 * deduplication, and database updates
 */

import { gdeltService } from './gdelt';
import { rssService } from './rss';
import { acledService } from './acled';
import { storage } from '../storage';
import type { InsertConflict, Conflict } from '@shared/schema';
import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  findMatchingCuratedConflict,
  isDuplicateArticle,
  filterRecentArticles
} from './matching';

// List of curated conflict IDs that should not be auto-updated
let curatedConflictIds: Set<string> = new Set();

export class DataIngestionService {
  private wss: WebSocketServer | null = null;

  constructor(wss?: WebSocketServer) {
    this.wss = wss || null;
    this.loadCuratedIds();
  }

  /**
   * Load list of curated conflict IDs that should not be auto-updated
   */
  private async loadCuratedIds(): Promise<void> {
    try {
      const filePath = join(process.cwd(), 'data', 'curated-ids.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const ids: string[] = JSON.parse(fileContent);
      curatedConflictIds = new Set(ids);
      console.log(`Loaded ${curatedConflictIds.size} curated conflict IDs (will not auto-update)`);
    } catch (error) {
      console.warn('Could not load curated conflict IDs, auto-ingestion may overwrite curated conflicts:', error);
    }
  }

  /**
   * Ingest recent conflict data from all sources
   */
  async ingestRecentData(daysBack: number = 7): Promise<{
    added: number;
    updated: number;
    errors: number;
    sources: string[];
  }> {
    console.log(`Starting data ingestion for last ${daysBack} days...`);

    const results = {
      added: 0,
      updated: 0,
      errors: 0,
      sources: [] as string[],
    };

    try {
      // Try GDELT first (no API key required)
      await this.ingestFromGDELT(daysBack * 24, results);

      // Try RSS feeds (simple, no API keys)
      await this.ingestFromRSS(results);

      // Try ACLED if configured
      if (process.env.ACLED_API_KEY) {
        await this.ingestFromACLED(daysBack, results);
      } else {
        console.log('ACLED not configured, skipping (optional)');
      }

      console.log('Ingestion complete:', results);
      return results;
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    }
  }

  /**
   * Ingest from GDELT (primary source - no API key needed)
   */
  private async ingestFromGDELT(hoursBack: number, results: any): Promise<void> {
    try {
      console.log(`Fetching from GDELT (last ${hoursBack} hours)...`);
      const articles = await gdeltService.fetchRecentConflicts(hoursBack);

      if (articles.length === 0) {
        console.log('No articles from GDELT');
        return;
      }

      const conflicts = await gdeltService.transformToConflicts(articles);
      console.log(`Transformed to ${conflicts.length} conflicts from GDELT`);

      for (const conflict of conflicts) {
        try {
          await this.upsertConflict(conflict, results);
        } catch (error) {
          console.error(`Error upserting GDELT conflict:`, error);
          results.errors++;
        }
      }

      results.sources.push('GDELT');
    } catch (error) {
      console.error('GDELT ingestion failed:', error);
      results.errors++;
    }
  }

  /**
   * Ingest from RSS feeds (backup source - no API key needed)
   */
  private async ingestFromRSS(results: any): Promise<void> {
    try {
      console.log('Fetching from RSS feeds...');
      const articles = await rssService.fetchAllArticles();

      if (articles.length === 0) {
        console.log('No articles from RSS');
        return;
      }

      const conflicts = await rssService.transformToConflicts(articles);
      console.log(`Transformed to ${conflicts.length} conflicts from RSS`);

      for (const conflict of conflicts) {
        try {
          await this.upsertConflict(conflict, results);
        } catch (error) {
          console.error(`Error upserting RSS conflict:`, error);
          results.errors++;
        }
      }

      results.sources.push('RSS');
    } catch (error) {
      console.error('RSS ingestion failed:', error);
      results.errors++;
    }
  }

  /**
   * Ingest from ACLED (optional if configured)
   */
  private async ingestFromACLED(daysBack: number, results: any): Promise<void> {
    try {
      console.log('Fetching from ACLED...');
      const acledEvents = await acledService.fetchRecentEvents(daysBack, 500);
      console.log(`Fetched ${acledEvents.length} events from ACLED`);

      // Group related events to avoid creating too many individual entries
      const groupedEvents = acledService.groupEvents(acledEvents);
      console.log(`Grouped into ${groupedEvents.size} conflict clusters`);

      // Process each group
      for (const [groupKey, events] of groupedEvents) {
        try {
          // Use the most recent/severe event as representative
          const representative = this.selectRepresentativeEvent(events);
          const conflict = acledService.transformToConflict(representative);

          // Aggregate data from all events in the group
          const aggregated = this.aggregateEvents(events, conflict);

          await this.upsertConflict(aggregated, results);
        } catch (error) {
          console.error(`Error processing ACLED group ${groupKey}:`, error);
          results.errors++;
        }
      }

      results.sources.push('ACLED');
    } catch (error) {
      console.error('ACLED ingestion failed:', error);
      results.errors++;
    }
  }

  /**
   * Select the most significant event from a group to represent it
   */
  private selectRepresentativeEvent(events: any[]): any {
    // Sort by fatalities (descending) and recency
    return events.sort((a, b) => {
      if (b.fatalities !== a.fatalities) {
        return b.fatalities - a.fatalities;
      }
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    })[0];
  }

  /**
   * Aggregate data from multiple events into a single conflict
   */
  private aggregateEvents(events: any[], baseConflict: any): InsertConflict {
    // Sum casualties from all events
    const totalCasualties = events.reduce((sum, e) => sum + (e.fatalities || 0), 0);

    // Get unique countries
    const countries = [...new Set(events.map(e => e.country))];

    // Find earliest event date
    const earliestDate = events.reduce((earliest, e) => {
      const date = new Date(e.event_date);
      return date < earliest ? date : earliest;
    }, new Date(events[0].event_date));

    // Collect all media links
    const mediaLinks = events.slice(0, 5).map(e => ({
      type: 'article' as const,
      url: `https://acleddata.com/data-export-tool/?event_id=${e.event_id_cnty}`,
      title: `ACLED Event: ${e.event_type} in ${e.location}`,
    }));

    return {
      ...baseConflict,
      casualties: totalCasualties,
      countries,
      startDate: earliestDate,
      mediaLinks,
      description: `${events.length} related conflict events in this area. ${baseConflict.description}`,
    };
  }

  /**
   * Insert or update a conflict in the database
   * NEW: Tries to match auto-ingested conflicts to curated ones and append recent articles
   */
  private async upsertConflict(
    conflict: InsertConflict,
    results: { added: number; updated: number }
  ): Promise<void> {
    try {
      // Get all conflicts for matching
      const allConflicts = await storage.getConflicts();

      // Try to find a matching curated conflict
      const matchingCurated = findMatchingCuratedConflict(
        {
          name: conflict.name,
          latitude: conflict.latitude,
          longitude: conflict.longitude,
          countries: conflict.countries,
        },
        allConflicts
      );

      if (matchingCurated) {
        // Found a match! Append recent article instead of creating new conflict
        console.log(`📰 Matched to curated conflict: ${matchingCurated.name}`);

        // Extract article from auto-ingested conflict
        const newArticle = {
          url: conflict.mediaLinks[0]?.url || '',
          title: conflict.mediaLinks[0]?.title || conflict.name,
          source: this.extractSource(conflict.mediaLinks[0]?.url || ''),
          publishedAt: new Date().toISOString(),
        };

        // Get existing recent articles or initialize empty array
        const existingArticles = matchingCurated.recentArticles || [];

        // Check if article already exists (prevent duplicates)
        if (!isDuplicateArticle(newArticle, existingArticles)) {
          // Add new article to recent articles
          const updatedArticles = [...existingArticles, newArticle];

          // Keep only last 7 days of articles
          const filteredArticles = filterRecentArticles(updatedArticles);

          // Update the curated conflict with new recent article
          await storage.updateConflict(matchingCurated.id, {
            recentArticles: filteredArticles,
            recentDataUpdated: new Date(),
          });

          results.updated++;
          console.log(`   ✅ Added recent article to: ${matchingCurated.name}`);

          // Broadcast update via WebSocket
          if (this.wss) {
            this.broadcastUpdate('conflict:updated', matchingCurated);
          }
        } else {
          console.log(`   ⏭️  Article already exists, skipping`);
        }

        return;
      }

      // No match found - check if this conflict ID already exists
      const existing = await storage.getConflict(conflict.id);

      if (existing) {
        // Update existing auto-ingested conflict
        if (this.shouldUpdate(existing, conflict)) {
          await storage.updateConflict(conflict.id, conflict);
          results.updated++;
          console.log(`Updated auto-ingested: ${conflict.name}`);

          // Broadcast update via WebSocket
          if (this.wss) {
            this.broadcastUpdate('conflict:updated', conflict);
          }
        }
      } else {
        // Create new auto-ingested conflict (no curated match found)
        await storage.createConflict({
          ...conflict,
          isAutoIngested: true, // Mark as auto-ingested
        });
        results.added++;
        console.log(`➕ Added new auto-ingested conflict: ${conflict.name}`);

        // Broadcast addition via WebSocket
        if (this.wss) {
          this.broadcastUpdate('conflict:added', conflict);
        }
      }
    } catch (error) {
      console.error(`Error upserting conflict ${conflict.id}:`, error);
      throw error;
    }
  }

  /**
   * Extract source name from URL
   */
  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      // Remove www. and extract domain name
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Determine if an existing conflict should be updated
   */
  private shouldUpdate(existing: any, updated: InsertConflict): boolean {
    // Update if casualties increased significantly (>10% or >10 people)
    const casualtyDiff = Math.abs(updated.casualties - existing.casualties);
    if (casualtyDiff > 10 || casualtyDiff / existing.casualties > 0.1) {
      return true;
    }

    // Update if new countries involved
    if (updated.countries.some(c => !existing.countries.includes(c))) {
      return true;
    }

    // Update if severity changed
    if (updated.severity !== existing.severity) {
      return true;
    }

    return false;
  }

  /**
   * Broadcast WebSocket update to all connected clients
   */
  private broadcastUpdate(type: string, data: any): void {
    if (!this.wss) return;

    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }

  /**
   * Manually trigger ingestion (useful for testing)
   */
  static async runManualIngestion(): Promise<void> {
    console.log('Running manual data ingestion...');
    const service = new DataIngestionService();
    const results = await service.ingestRecentData(7);
    console.log('Manual ingestion complete:', results);
  }
}

// Export singleton instance
export function createIngestionService(wss: WebSocketServer): DataIngestionService {
  return new DataIngestionService(wss);
}
