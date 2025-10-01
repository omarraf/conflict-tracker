export interface Conflict {
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

export interface FilterState {
  region: string;
  severity: string;
  timeline: string;
  searchQuery: string;
}
