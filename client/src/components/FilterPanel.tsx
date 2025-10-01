import { Search, Filter, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { FilterState } from '../types/conflict';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  conflictCount: number;
}

export function FilterPanel({ filters, onFilterChange, conflictCount }: FilterPanelProps) {
  const regions = [
    'All Regions',
    'Africa',
    'Asia',
    'Eastern Europe',
    'Middle East',
    'South Asia',
    'Southeast Asia',
  ];

  const severities = ['All Severities', 'low', 'medium', 'high', 'critical'];

  const timelines = [
    'All Time',
    'Last Year',
    'Last 5 Years',
    'Last 10 Years',
    'Last 20 Years',
  ];

  const handleReset = () => {
    onFilterChange({
      region: 'All Regions',
      severity: 'All Severities',
      timeline: 'All Time',
      searchQuery: '',
    });
  };

  return (
    <Card className="bg-gray-900/95 backdrop-blur-lg border-white/10 text-white p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Conflicts
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {conflictCount} {conflictCount === 1 ? 'conflict' : 'conflicts'} shown
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-white border-white/30 hover:bg-white/10"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <Label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Label>
          <Input
            placeholder="Search conflicts..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Region */}
        <div>
          <Label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Region
          </Label>
          <Select
            value={filters.region}
            onValueChange={(value) =>
              onFilterChange({ ...filters, region: value })
            }
          >
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/20 text-white">
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Severity */}
        <div>
          <Label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Severity
          </Label>
          <Select
            value={filters.severity}
            onValueChange={(value) =>
              onFilterChange({ ...filters, severity: value })
            }
          >
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/20 text-white">
              {severities.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        <div>
          <Label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </Label>
          <Select
            value={filters.timeline}
            onValueChange={(value) =>
              onFilterChange({ ...filters, timeline: value })
            }
          >
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/20 text-white">
              {timelines.map((timeline) => (
                <SelectItem key={timeline} value={timeline}>
                  {timeline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
