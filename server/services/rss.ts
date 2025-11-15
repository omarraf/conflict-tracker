/**
 * RSS Feed Service for Conflict News
 * Simple, no API keys required
 */

import { parseStringPromise } from 'xml2js';

interface RSSFeed {
  name: string;
  url: string;
  region?: string;
}

interface RSSArticle {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  source: string;
}

export class RSSService {
  private feeds: RSSFeed[] = [
    // Reuters Conflict Coverage
    {
      name: 'Reuters World News',
      url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
      region: 'Global',
    },
    // Al Jazeera
    {
      name: 'Al Jazeera',
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      region: 'Global',
    },
    // BBC News
    {
      name: 'BBC World',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      region: 'Global',
    },
    // Crisis Group
    {
      name: 'Crisis Group',
      url: 'https://www.crisisgroup.org/rss.xml',
      region: 'Global',
    },
  ];

  /**
   * Fetch articles from all RSS feeds
   */
  async fetchAllArticles(): Promise<RSSArticle[]> {
    const allArticles: RSSArticle[] = [];

    for (const feed of this.feeds) {
      try {
        const articles = await this.fetchFeed(feed);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching RSS feed ${feed.name}:`, error);
        // Continue with other feeds
      }
    }

    // Sort by date, newest first
    return allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  }

  /**
   * Fetch and parse a single RSS feed
   */
  private async fetchFeed(feed: RSSFeed): Promise<RSSArticle[]> {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'ConflictTracker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const parsed = await parseStringPromise(xml);

      // Handle different RSS formats
      const items = parsed.rss?.channel?.[0]?.item || parsed.feed?.entry || [];

      return items.map((item: any) => ({
        title: this.extractText(item.title),
        link: this.extractLink(item),
        pubDate: this.extractDate(item),
        description: this.extractText(item.description || item.summary),
        source: feed.name,
      })).filter((article: RSSArticle) => this.isConflictRelated(article));
    } catch (error) {
      console.error(`Failed to parse RSS feed ${feed.name}:`, error);
      return [];
    }
  }

  /**
   * Filter for conflict-related articles
   */
  private isConflictRelated(article: RSSArticle): boolean {
    const text = `${article.title} ${article.description}`.toLowerCase();

    const conflictKeywords = [
      'war', 'conflict', 'attack', 'violence', 'military', 'strike',
      'fighting', 'clash', 'battle', 'killed', 'casualties', 'terrorism',
      'insurgency', 'rebellion', 'protest', 'unrest', 'crisis', 'hostilities'
    ];

    return conflictKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Transform RSS articles into conflicts
   */
  async transformToConflicts(articles: RSSArticle[]): Promise<any[]> {
    const conflicts: any[] = [];

    // Group by detected country/region
    const grouped = this.groupByLocation(articles);

    for (const [location, locationArticles] of grouped) {
      const conflict = this.createConflictFromArticles(location, locationArticles);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Group articles by detected location
   */
  private groupByLocation(articles: RSSArticle[]): Map<string, RSSArticle[]> {
    const grouped = new Map<string, RSSArticle[]>();

    for (const article of articles) {
      const location = this.detectLocation(article);
      const existing = grouped.get(location) || [];
      existing.push(article);
      grouped.set(location, existing);
    }

    return grouped;
  }

  /**
   * Detect country/location from article
   */
  private detectLocation(article: RSSArticle): string {
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Check for country names
    const countries = [
      'ukraine', 'russia', 'israel', 'palestine', 'gaza', 'syria', 'iraq',
      'afghanistan', 'yemen', 'somalia', 'sudan', 'myanmar', 'ethiopia',
      'nigeria', 'pakistan', 'india', 'china', 'venezuela', 'colombia'
    ];

    for (const country of countries) {
      if (text.includes(country)) {
        return country.charAt(0).toUpperCase() + country.slice(1);
      }
    }

    return 'Global';
  }

  /**
   * Create conflict from grouped articles
   */
  private createConflictFromArticles(location: string, articles: RSSArticle[]): any | null {
    if (articles.length === 0) return null;

    const coords = this.getLocationCoords(location);
    if (!coords) return null;

    const severity = this.estimateSeverity(articles);
    const region = this.mapToRegion(location);

    return {
      id: `rss-${location.toLowerCase()}-${Date.now()}`,
      name: `Recent Conflict Events - ${location}`,
      startDate: articles[0].pubDate,
      casualties: this.estimateCasualties(articles),
      countries: [location],
      region,
      severity,
      latitude: coords.lat,
      longitude: coords.lon,
      description: this.generateDescription(articles),
      mediaLinks: articles.slice(0, 5).map(article => ({
        type: 'article' as const,
        url: article.link,
        title: article.title,
      })),
      educationalResources: [
        {
          title: 'RSS News Aggregation',
          url: 'https://en.wikipedia.org/wiki/RSS',
        },
      ],
      status: 'active' as const,
    };
  }

  private getLocationCoords(location: string): { lat: number; lon: number } | null {
    const coords: Record<string, { lat: number; lon: number }> = {
      'Ukraine': { lat: 50.4501, lon: 30.5234 },
      'Russia': { lat: 55.7558, lon: 37.6173 },
      'Israel': { lat: 31.7683, lon: 35.2137 },
      'Palestine': { lat: 31.9522, lon: 35.2332 },
      'Gaza': { lat: 31.5, lon: 34.4668 },
      'Syria': { lat: 33.5138, lon: 36.2765 },
      'Iraq': { lat: 33.3152, lon: 44.3661 },
      'Afghanistan': { lat: 34.5553, lon: 69.2075 },
      'Yemen': { lat: 15.3694, lon: 44.191 },
      'Somalia': { lat: 2.0469, lon: 45.3182 },
      'Sudan': { lat: 15.5007, lon: 32.5599 },
      'Myanmar': { lat: 16.8661, lon: 96.1951 },
      'Ethiopia': { lat: 9.145, lon: 40.4897 },
      'Nigeria': { lat: 9.0765, lon: 7.3986 },
      'Pakistan': { lat: 33.6844, lon: 73.0479 },
      'India': { lat: 28.6139, lon: 77.209 },
      'China': { lat: 39.9042, lon: 116.4074 },
      'Venezuela': { lat: 10.4806, lon: -66.9036 },
      'Colombia': { lat: 4.711, lon: -74.0721 },
    };

    return coords[location] || null;
  }

  private estimateSeverity(articles: RSSArticle[]): 'low' | 'medium' | 'high' | 'critical' {
    const text = articles.map(a => `${a.title} ${a.description}`).join(' ').toLowerCase();

    // Check for severe keywords
    const severeKeywords = ['killed', 'dead', 'casualties', 'bombing', 'massacre', 'genocide'];
    const moderateKeywords = ['injured', 'wounded', 'fighting', 'clash', 'strike'];

    const severeCount = severeKeywords.filter(k => text.includes(k)).length;
    const moderateCount = moderateKeywords.filter(k => text.includes(k)).length;

    if (severeCount >= 3 || articles.length > 20) return 'critical';
    if (severeCount >= 2 || articles.length > 10) return 'high';
    if (moderateCount >= 2 || articles.length > 5) return 'medium';
    return 'low';
  }

  private estimateCasualties(articles: RSSArticle[]): number {
    const text = articles.map(a => `${a.title} ${a.description}`).join(' ');

    // Try to extract numbers near casualty keywords
    const matches = text.match(/(\d+)\s*(killed|dead|casualties|deaths)/gi);

    if (matches && matches.length > 0) {
      const numbers = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
      return Math.max(...numbers);
    }

    // Fallback estimation
    return articles.length * 5;
  }

  private generateDescription(articles: RSSArticle[]): string {
    const latest = articles[0];

    return `${articles.length} recent news reports covering conflict events in this region.

Latest Report: "${latest.title}"
Source: ${latest.source}
Published: ${latest.pubDate.toLocaleString()}

${latest.description.slice(0, 300)}...

This data is aggregated from multiple international news RSS feeds including ${articles.map(a => a.source).filter((v, i, a) => a.indexOf(v) === i).join(', ')}.`;
  }

  private mapToRegion(country: string): string {
    const regionMap: Record<string, string> = {
      'Ukraine': 'Eastern Europe',
      'Russia': 'Eastern Europe',
      'Israel': 'Middle East',
      'Palestine': 'Middle East',
      'Gaza': 'Middle East',
      'Syria': 'Middle East',
      'Iraq': 'Middle East',
      'Yemen': 'Middle East',
      'Afghanistan': 'Central Asia',
      'Pakistan': 'South Asia',
      'India': 'South Asia',
      'Myanmar': 'Southeast Asia',
      'China': 'East Asia',
      'Somalia': 'East Africa',
      'Ethiopia': 'East Africa',
      'Sudan': 'North Africa',
      'Nigeria': 'West Africa',
      'Venezuela': 'South America',
      'Colombia': 'South America',
    };

    return regionMap[country] || 'Other';
  }

  private extractText(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field[0] || '';
    if (field._) return field._;
    return String(field);
  }

  private extractLink(item: any): string {
    if (item.link) {
      if (typeof item.link === 'string') return item.link;
      if (Array.isArray(item.link)) return item.link[0];
      if (item.link.$?.href) return item.link.$.href;
    }
    return '';
  }

  private extractDate(item: any): Date {
    const dateStr = this.extractText(item.pubDate || item.published || item.updated);
    return dateStr ? new Date(dateStr) : new Date();
  }
}

export const rssService = new RSSService();
