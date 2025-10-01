import { X, Calendar, Users, MapPin, ExternalLink, BookOpen, TrendingUp } from 'lucide-react';
import { Conflict } from '../types/conflict';
import { formatNumber, getYearsSince } from '../lib/coordinates';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface ConflictSidebarProps {
  conflict: Conflict | null;
  onClose: () => void;
}

export function ConflictSidebar({ conflict, onClose }: ConflictSidebarProps) {
  if (!conflict) return null;

  const yearsSince = getYearsSince(conflict.startDate);
  const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full md:w-[450px] bg-gray-900/95 backdrop-blur-lg border-l border-white/10 text-white shadow-2xl z-50 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{conflict.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${severityColors[conflict.severity]} text-white`}>
                  {conflict.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30">
                  {conflict.status}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Start Date</span>
              </div>
              <div className="text-lg font-semibold">
                {new Date(conflict.startDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {yearsSince} {yearsSince === 1 ? 'year' : 'years'} ago
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Casualties</span>
              </div>
              <div className="text-lg font-semibold">
                ~{formatNumber(conflict.casualties)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Estimated</div>
            </Card>
          </div>

          {/* Region & Countries */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Region & Countries</span>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="font-medium mb-2">{conflict.region}</div>
              <div className="flex flex-wrap gap-2">
                {conflict.countries.map((country) => (
                  <Badge
                    key={country}
                    variant="secondary"
                    className="bg-white/10 text-white"
                  >
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-sm leading-relaxed text-gray-200">
              {conflict.description}
            </p>
          </div>

          <Separator className="bg-white/10 mb-6" />

          {/* Media Links */}
          {conflict.mediaLinks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-400 mb-3">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">Media & Coverage</span>
              </div>
              <div className="space-y-2">
                {conflict.mediaLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {link.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {link.type.toUpperCase()}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Educational Resources */}
          {conflict.educationalResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-400 mb-3">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Educational Resources</span>
              </div>
              <div className="space-y-2">
                {conflict.educationalResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-blue-500/10 hover:bg-blue-500/20 rounded-lg p-3 border border-blue-500/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-300">
                        {resource.title}
                      </div>
                      <ExternalLink className="h-4 w-4 text-blue-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
