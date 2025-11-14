/**
 * GDELT (Global Database of Events, Language and Tone) Integration
 * Free, real-time global event data - NO API KEY REQUIRED
 * Documentation: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/
 */

interface GDELTEvent {
  GLOBALEVENTID: string;
  SQLDATE: string;
  MonthYear: string;
  Year: string;
  FractionDate: string;
  Actor1Code: string;
  Actor1Name: string;
  Actor1CountryCode: string;
  Actor1Type1Code: string;
  Actor2Code: string;
  Actor2Name: string;
  Actor2CountryCode: string;
  Actor2Type1Code: string;
  IsRootEvent: string;
  EventCode: string;
  EventBaseCode: string;
  EventRootCode: string;
  QuadClass: string;
  GoldsteinScale: string;
  NumMentions: string;
  NumSources: string;
  NumArticles: string;
  AvgTone: string;
  Actor1Geo_Type: string;
  Actor1Geo_FullName: string;
  Actor1Geo_CountryCode: string;
  Actor1Geo_Lat: string;
  Actor1Geo_Long: string;
  Actor2Geo_Type: string;
  Actor2Geo_FullName: string;
  Actor2Geo_CountryCode: string;
  Actor2Geo_Lat: string;
  Actor2Geo_Long: string;
  ActionGeo_Type: string;
  ActionGeo_FullName: string;
  ActionGeo_CountryCode: string;
  ActionGeo_Lat: string;
  ActionGeo_Long: string;
  DATEADDED: string;
  SOURCEURL: string;
}

export class GDELTService {
  private baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';

  /**
   * Fetch recent conflict-related events from GDELT
   * @param hoursBack Number of hours to look back (default: 24)
   */
  async fetchRecentConflicts(hoursBack: number = 24): Promise<any[]> {
    try {
      // GDELT query for conflict-related events
      // mode=ArtList gets article list, format=json for JSON response
      const query = 'conflict OR war OR violence OR attack OR terrorism OR military';
      const params = new URLSearchParams({
        query: query,
        mode: 'ArtList',
        maxrecords: '250',
        format: 'json',
        timespan: `${hoursBack}h`,
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.articles?.length || 0} articles from GDELT`);

      return data.articles || [];
    } catch (error) {
      console.error('Error fetching GDELT data:', error);
      throw error;
    }
  }

  /**
   * Fetch events by specific country
   */
  async fetchByCountry(country: string, hoursBack: number = 48): Promise<any[]> {
    try {
      const query = `${country} AND (conflict OR war OR violence OR attack)`;
      const params = new URLSearchParams({
        query: query,
        mode: 'ArtList',
        maxrecords: '100',
        format: 'json',
        timespan: `${hoursBack}h`,
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const data = await response.json();

      return data.articles || [];
    } catch (error) {
      console.error(`Error fetching GDELT data for ${country}:`, error);
      throw error;
    }
  }

  /**
   * Transform GDELT articles into conflict format
   */
  async transformToConflicts(articles: any[]): Promise<any[]> {
    const conflicts: any[] = [];

    // Group articles by location to create meaningful conflicts
    const grouped = this.groupByLocation(articles);

    for (const [location, locationArticles] of grouped) {
      const conflict = this.createConflictFromArticles(locationArticles);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Group articles by location
   */
  private groupByLocation(articles: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const article of articles) {
      // Use seencc (countries mentioned) as location key
      const location = article.seencc || article.domain || 'unknown';
      const existing = grouped.get(location) || [];
      existing.push(article);
      grouped.set(location, existing);
    }

    return grouped;
  }

  /**
   * Create a single conflict from grouped articles
   */
  private createConflictFromArticles(articles: any[]): any | null {
    if (articles.length === 0) return null;

    const primaryArticle = articles[0];

    // Extract location info
    const countries = this.extractCountries(articles);
    const location = this.extractLocation(primaryArticle);
    const coords = this.extractCoordinates(primaryArticle, countries[0]);

    if (!coords) {
      return null; // Skip if we can't get coordinates
    }

    // Determine severity from tone and volume
    const severity = this.calculateSeverity(articles);

    // Generate unique ID
    const id = `gdelt-${primaryArticle.seencc || 'global'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      name: this.generateConflictName(primaryArticle, countries),
      startDate: new Date(primaryArticle.seendatetime || Date.now()),
      casualties: this.estimateCasualties(articles),
      countries,
      region: this.mapToRegion(countries[0]),
      severity,
      latitude: coords.lat,
      longitude: coords.lon,
      description: this.generateDescription(articles),
      mediaLinks: articles.slice(0, 5).map(article => ({
        type: 'article' as const,
        url: article.url || '',
        title: article.title || 'GDELT Event Report',
      })),
      educationalResources: [
        {
          title: 'GDELT Global Events Database',
          url: 'https://www.gdeltproject.org/',
        },
      ],
      status: 'active' as const,
    };
  }

  private extractCountries(articles: any[]): string[] {
    const countries = new Set<string>();

    for (const article of articles) {
      if (article.seencc) {
        // seencc is comma-separated country codes
        article.seencc.split(',').forEach((cc: string) => {
          const country = this.countryCodeToName(cc.trim());
          if (country) countries.add(country);
        });
      }
    }

    return Array.from(countries).slice(0, 3); // Max 3 countries
  }

  private extractLocation(article: any): string {
    return article.sourcelang || article.domain || 'Unknown Location';
  }

  private extractCoordinates(article: any, country: string): { lat: number; lon: number } | null {
    // GDELT doesn't provide exact coordinates in article list
    // We'll use country capital coordinates as fallback
    return this.getCountryCapitalCoords(country);
  }

  private getCountryCapitalCoords(country: string): { lat: number; lon: number } | null {
    // Map of major countries to their capital coordinates
    const capitals: Record<string, { lat: number; lon: number }> = {
      'United States': { lat: 38.9072, lon: -77.0369 },
      'Ukraine': { lat: 50.4501, lon: 30.5234 },
      'Russia': { lat: 55.7558, lon: 37.6173 },
      'Israel': { lat: 31.7683, lon: 35.2137 },
      'Palestine': { lat: 31.9522, lon: 35.2332 },
      'Syria': { lat: 33.5138, lon: 36.2765 },
      'Iraq': { lat: 33.3152, lon: 44.3661 },
      'Afghanistan': { lat: 34.5553, lon: 69.2075 },
      'Yemen': { lat: 15.3694, lon: 44.191 },
      'Somalia': { lat: 2.0469, lon: 45.3182 },
      'Sudan': { lat: 15.5007, lon: 32.5599 },
      'Myanmar': { lat: 16.8661, lon: 96.1951 },
      'China': { lat: 39.9042, lon: 116.4074 },
      'India': { lat: 28.6139, lon: 77.209 },
      'Pakistan': { lat: 33.6844, lon: 73.0479 },
      'Nigeria': { lat: 9.0765, lon: 7.3986 },
      'Ethiopia': { lat: 9.145, lon: 40.4897 },
      'Venezuela': { lat: 10.4806, lon: -66.9036 },
      'Colombia': { lat: 4.711, lon: -74.0721 },
      'Mexico': { lat: 19.4326, lon: -99.1332 },
    };

    return capitals[country] || null;
  }

  private calculateSeverity(articles: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const avgTone = articles.reduce((sum, a) => sum + (parseFloat(a.tone) || 0), 0) / articles.length;
    const volume = articles.length;

    // More negative tone = higher severity
    // More articles = higher severity
    if (avgTone < -5 || volume > 50) {
      return 'critical';
    } else if (avgTone < -2 || volume > 20) {
      return 'high';
    } else if (avgTone < 0 || volume > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private estimateCasualties(articles: any[]): number {
    // Rough estimate based on article volume and tone
    const volume = articles.length;
    const avgTone = articles.reduce((sum, a) => sum + (parseFloat(a.tone) || 0), 0) / articles.length;

    if (avgTone < -8 && volume > 100) return 1000;
    if (avgTone < -5 && volume > 50) return 500;
    if (avgTone < -3 && volume > 20) return 100;
    if (avgTone < 0 && volume > 10) return 50;
    return 10;
  }

  private generateConflictName(article: any, countries: string[]): string {
    const location = countries.join(', ') || 'Multiple Locations';
    return `Ongoing Conflict Events in ${location}`;
  }

  private generateDescription(articles: any[]): string {
    const firstArticle = articles[0];
    const count = articles.length;
    const avgTone = (articles.reduce((sum, a) => sum + (parseFloat(a.tone) || 0), 0) / articles.length).toFixed(1);

    return `${count} related news articles covering ongoing conflict events.

Average Sentiment: ${avgTone} (negative values indicate more severe events)
Media Coverage: ${count} sources

Latest Report: ${firstArticle.title || 'No title available'}
Source: ${firstArticle.domain || 'Unknown'}
Date: ${new Date(firstArticle.seendatetime).toLocaleString()}

This conflict data is aggregated from global news sources via GDELT's real-time event monitoring system.`;
  }

  private mapToRegion(country: string): string {
    const regionMap: Record<string, string> = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'Central America',
      'Ukraine': 'Eastern Europe',
      'Russia': 'Eastern Europe',
      'Poland': 'Eastern Europe',
      'Israel': 'Middle East',
      'Palestine': 'Middle East',
      'Syria': 'Middle East',
      'Iraq': 'Middle East',
      'Iran': 'Middle East',
      'Yemen': 'Middle East',
      'Afghanistan': 'Central Asia',
      'Pakistan': 'South Asia',
      'India': 'South Asia',
      'China': 'East Asia',
      'Myanmar': 'Southeast Asia',
      'Somalia': 'East Africa',
      'Ethiopia': 'East Africa',
      'Sudan': 'North Africa',
      'Nigeria': 'West Africa',
      'Colombia': 'South America',
      'Venezuela': 'South America',
    };

    return regionMap[country] || 'Other';
  }

  private countryCodeToName(code: string): string | null {
    const codeMap: Record<string, string> = {
      'US': 'United States',
      'UA': 'Ukraine',
      'RU': 'Russia',
      'IL': 'Israel',
      'PS': 'Palestine',
      'SY': 'Syria',
      'IQ': 'Iraq',
      'AF': 'Afghanistan',
      'YE': 'Yemen',
      'SO': 'Somalia',
      'SD': 'Sudan',
      'MM': 'Myanmar',
      'CN': 'China',
      'IN': 'India',
      'PK': 'Pakistan',
      'NG': 'Nigeria',
      'ET': 'Ethiopia',
      'VE': 'Venezuela',
      'CO': 'Colombia',
      'MX': 'Mexico',
    };

    return codeMap[code.toUpperCase()] || null;
  }
}

export const gdeltService = new GDELTService();
