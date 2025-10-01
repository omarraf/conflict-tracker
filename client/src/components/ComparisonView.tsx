import { X, Plus, Calendar, MapPin, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Conflict } from '../types/conflict';

interface ComparisonViewProps {
  conflicts: Conflict[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function ComparisonView({ conflicts, onRemove, onClose }: ComparisonViewProps) {
  if (conflicts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ongoing':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl w-full max-w-7xl max-h-[95vh] md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">Conflict Comparison</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Comparing {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: conflicts.length === 1 ? '1fr' : undefined }}>
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-gray-800/50 rounded-lg border border-white/10 p-4 relative"
              >
                {/* Remove Button */}
                <button
                  onClick={() => onRemove(conflict.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors"
                  title="Remove from comparison"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>

                {/* Conflict Name */}
                <h3 className="text-lg font-semibold text-white pr-8 mb-3">
                  {conflict.name}
                </h3>

                {/* Comparison Fields */}
                <div className="space-y-3">
                  {/* Region */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Region</p>
                      <p className="text-sm text-white">{conflict.region}</p>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Started</p>
                      <p className="text-sm text-white">
                        {new Date(conflict.startDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Countries */}
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Countries Involved</p>
                      <p className="text-sm text-white">
                        {conflict.countries.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Casualties */}
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Casualties</p>
                      <p className="text-sm text-white">
                        {conflict.casualties.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getSeverityColor(conflict.severity)}`}>
                      <div className="w-full h-full rounded-full bg-current" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Severity</p>
                      <p className={`text-sm font-medium capitalize ${getSeverityColor(conflict.severity)}`}>
                        {conflict.severity}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-start gap-2">
                    {getStatusIcon(conflict.status)}
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-sm text-white capitalize">{conflict.status}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-300 line-clamp-4">
                      {conflict.description}
                    </p>
                  </div>

                  {/* Educational Resources */}
                  {conflict.educationalResources.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Resources</p>
                      <div className="space-y-1">
                        {conflict.educationalResources.slice(0, 2).map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 block truncate"
                          >
                            {resource.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add More Card (only show if less than 4 conflicts) */}
            {conflicts.length < 4 && (
              <div className="bg-gray-800/30 rounded-lg border border-dashed border-white/20 p-4 flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-400">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click a conflict marker</p>
                  <p className="text-xs opacity-75">to add to comparison</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-gray-900/50">
          <p className="text-xs text-gray-400 text-center">
            Click the X on each card to remove from comparison • Maximum 4 conflicts can be compared
          </p>
        </div>
      </div>
    </div>
  );
}
