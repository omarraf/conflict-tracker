/**
 * ACLED (Armed Conflict Location & Event Data Project) API Integration
 * Documentation: https://apidocs.acleddata.com/
 */

interface ACLEDEvent {
  event_id_cnty: string;
  event_date: string;
  year: number;
  time_precision: number;
  disorder_type: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  assoc_actor_1: string;
  inter1: number;
  actor2: string;
  assoc_actor_2: string;
  inter2: number;
  interaction: number;
  civilian_targeting: string;
  iso: number;
  region: string;
  country: string;
  admin1: string;
  admin2: string;
  admin3: string;
  location: string;
  latitude: number;
  longitude: number;
  geo_precision: number;
  source: string;
  source_scale: string;
  notes: string;
  fatalities: number;
  tags: string;
  timestamp: number;
}

interface ACLEDResponse {
  success: boolean;
  count: number;
  data: ACLEDEvent[];
}

export class ACLEDService {
  private apiKey: string;
  private email: string;
  private baseUrl = 'https://api.acleddata.com/acled/read';

  constructor() {
    this.apiKey = process.env.ACLED_API_KEY || '';
    this.email = process.env.ACLED_EMAIL || '';

    if (!this.apiKey || !this.email) {
      console.warn('ACLED API credentials not configured. Set ACLED_API_KEY and ACLED_EMAIL environment variables.');
    }
  }

  /**
   * Fetch recent conflict events from ACLED
   * @param daysBack Number of days to look back (default: 7)
   * @param limit Maximum number of events to fetch (default: 500)
   */
  async fetchRecentEvents(daysBack: number = 7, limit: number = 500): Promise<ACLEDEvent[]> {
    if (!this.apiKey || !this.email) {
      throw new Error('ACLED API credentials not configured');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const params = new URLSearchParams({
      key: this.apiKey,
      email: this.email,
      event_date: `${this.formatDate(startDate)}|${this.formatDate(endDate)}`,
      event_date_where: 'BETWEEN',
      limit: limit.toString(),
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`ACLED API error: ${response.status} ${response.statusText}`);
      }

      const data: ACLEDResponse = await response.json();

      if (!data.success) {
        throw new Error('ACLED API returned unsuccessful response');
      }

      console.log(`Fetched ${data.count} events from ACLED`);
      return data.data;
    } catch (error) {
      console.error('Error fetching ACLED data:', error);
      throw error;
    }
  }

  /**
   * Fetch events by country
   */
  async fetchEventsByCountry(country: string, daysBack: number = 30): Promise<ACLEDEvent[]> {
    if (!this.apiKey || !this.email) {
      throw new Error('ACLED API credentials not configured');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const params = new URLSearchParams({
      key: this.apiKey,
      email: this.email,
      country: country,
      event_date: `${this.formatDate(startDate)}|${this.formatDate(endDate)}`,
      event_date_where: 'BETWEEN',
      limit: '500',
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      const data: ACLEDResponse = await response.json();

      if (!data.success) {
        throw new Error('ACLED API returned unsuccessful response');
      }

      return data.data;
    } catch (error) {
      console.error(`Error fetching ACLED data for ${country}:`, error);
      throw error;
    }
  }

  /**
   * Transform ACLED events into our Conflict format
   * Groups events by location/actor/type to create meaningful conflicts
   */
  transformToConflict(event: ACLEDEvent) {
    // Map ACLED regions to our regions
    const regionMap: Record<string, string> = {
      'Middle East': 'Middle East',
      'Eastern Europe': 'Eastern Europe',
      'Western Europe': 'Western Europe',
      'South Asia': 'South Asia',
      'Southeast Asia': 'Southeast Asia',
      'East Asia': 'East Asia',
      'Central Asia': 'Central Asia',
      'Northern Africa': 'North Africa',
      'Southern Africa': 'Southern Africa',
      'Western Africa': 'West Africa',
      'Eastern Africa': 'East Africa',
      'Central Africa': 'Central Africa',
      'South America': 'South America',
      'Central America': 'Central America',
      'North America': 'North America',
      'Caribbean': 'Caribbean',
      'Oceania': 'Oceania',
    };

    // Determine severity based on fatalities and event type
    const severity = this.calculateSeverity(event);

    // Generate conflict ID based on location and actors
    const conflictId = this.generateConflictId(event);

    return {
      id: conflictId,
      name: this.generateConflictName(event),
      startDate: new Date(event.event_date),
      casualties: event.fatalities,
      countries: [event.country],
      region: regionMap[event.region] || event.region,
      severity,
      latitude: event.latitude,
      longitude: event.longitude,
      description: this.generateDescription(event),
      mediaLinks: [
        {
          type: 'article' as const,
          url: `https://acleddata.com/data-export-tool/?event_id=${event.event_id_cnty}`,
          title: `ACLED Event Report: ${event.event_id_cnty}`,
        },
      ],
      educationalResources: [
        {
          title: 'ACLED Conflict Data',
          url: 'https://acleddata.com/',
        },
      ],
      status: 'active' as const,
    };
  }

  /**
   * Group related ACLED events into unified conflicts
   * This helps reduce duplication and creates more meaningful conflict entries
   */
  groupEvents(events: ACLEDEvent[]): Map<string, ACLEDEvent[]> {
    const grouped = new Map<string, ACLEDEvent[]>();

    for (const event of events) {
      const key = this.generateGroupKey(event);
      const existing = grouped.get(key) || [];
      existing.push(event);
      grouped.set(key, existing);
    }

    return grouped;
  }

  private generateGroupKey(event: ACLEDEvent): string {
    // Group by country + general area + actor1
    const area = event.admin1 || event.location;
    return `${event.country}-${area}-${event.actor1}`.toLowerCase().replace(/\s+/g, '-');
  }

  private generateConflictId(event: ACLEDEvent): string {
    return `acled-${event.event_id_cnty}`;
  }

  private generateConflictName(event: ACLEDEvent): string {
    const actors = [event.actor1, event.actor2].filter(Boolean).join(' vs ');
    return `${event.event_type} in ${event.location || event.country}${actors ? ': ' + actors : ''}`;
  }

  private generateDescription(event: ACLEDEvent): string {
    return `${event.event_type}: ${event.sub_event_type}. ${event.notes || 'No additional details available.'}

Location: ${event.location}, ${event.admin1 || event.country}
Date: ${event.event_date}
Fatalities: ${event.fatalities}
Source: ${event.source}`;
  }

  private calculateSeverity(event: ACLEDEvent): 'low' | 'medium' | 'high' | 'critical' {
    const fatalities = event.fatalities;
    const eventType = event.event_type.toLowerCase();

    // High severity event types
    const criticalTypes = ['battles', 'violence against civilians', 'explosions/remote violence'];

    if (fatalities >= 100 || criticalTypes.some(t => eventType.includes(t))) {
      return 'critical';
    } else if (fatalities >= 25) {
      return 'high';
    } else if (fatalities >= 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export const acledService = new ACLEDService();
